import { Cluster } from '../models/Cluster.js';
import { Group } from '../models/Group.js';
import { Expense } from '../models/Expense.js';
import { Settlement } from '../models/Settlement.js';
import { simplifyDebts } from '../utils/simplifyDebts.js';

// @route   POST /api/clusters
// @desc    Create a new trip cluster combining multiple daily groups
export const createCluster = async (req, res) => {
  try {
    const { name, description, groups = [], image = '' } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Cluster name is required' });
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({ message: 'Please select at least one circle/group to cluster' });
    }

    // Verify user belongs to the selected groups
    const verifiedGroups = await Group.find({
      _id: { $in: groups },
      members: req.user._id,
    });

    if (verifiedGroups.length === 0) {
      return res.status(403).json({ message: 'You must be a member of the selected groups' });
    }

    const cluster = await Cluster.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      groups: verifiedGroups.map((g) => g._id),
      image: typeof image === 'string' ? image.trim() : '',
      createdBy: req.user._id,
    });

    const populated = await Cluster.findById(cluster._id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'groups',
        select: 'name description date members',
        populate: { path: 'members', select: 'name email' },
      });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/clusters
// @desc    Get all clusters the user is involved in
export const getMyClusters = async (req, res) => {
  try {
    // Find all groups where user is a member
    const userGroups = await Group.find({ members: req.user._id }).select('_id');
    const userGroupIds = userGroups.map((g) => g._id);

    // Find clusters created by user OR containing any of user's groups
    const clusters = await Cluster.find({
      $or: [{ createdBy: req.user._id }, { groups: { $in: userGroupIds } }],
    })
      .populate('createdBy', 'name email')
      .populate({
        path: 'groups',
        select: 'name description date members',
        populate: { path: 'members', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.json(clusters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/clusters/:id
// @desc    Get single cluster by ID with populated groups
export const getClusterById = async (req, res) => {
  try {
    const cluster = await Cluster.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'groups',
        select: 'name description date members createdBy',
        populate: [
          { path: 'members', select: 'name email' },
          { path: 'createdBy', select: 'name email' },
        ],
      });

    if (!cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    // Verify user is creator or in at least one group
    const isMember =
      cluster.createdBy._id.toString() === req.user._id.toString() ||
      cluster.groups.some((grp) =>
        grp.members.some((m) => m._id.toString() === req.user._id.toString())
      );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(cluster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/clusters/:id/balances
// @desc    Consolidate balances across all groups in the trip cluster and return final debt summary
export const getClusterBalances = async (req, res) => {
  try {
    const cluster = await Cluster.findById(req.params.id).populate({
      path: 'groups',
      select: 'name date members',
      populate: { path: 'members', select: 'name email' },
    });

    if (!cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    // Verify user access
    const isMember =
      cluster.createdBy.toString() === req.user._id.toString() ||
      cluster.groups.some((grp) =>
        grp.members.some((m) => m._id.toString() === req.user._id.toString())
      );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const groupIds = cluster.groups.map((g) => g._id);

    // Map all unique members across all groups
    const memberMap = {};
    const balances = {};

    cluster.groups.forEach((grp) => {
      grp.members.forEach((m) => {
        const id = m._id.toString();
        if (!memberMap[id]) {
          memberMap[id] = m;
          balances[id] = 0;
        }
      });
    });

    // 1. Process all expenses across all groups in this cluster
    const expenses = await Expense.find({ groupId: { $in: groupIds } }).populate('paidBy', 'name email');
    let totalExpense = 0;

    // Track group breakdown
    const groupSpending = {};
    groupIds.forEach((gid) => {
      groupSpending[gid.toString()] = { count: 0, total: 0 };
    });

    // Track per-user per-trip breakdown
    const userTripStats = {};
    Object.keys(memberMap).forEach((uid) => {
      userTripStats[uid] = {};
      groupIds.forEach((gid) => {
        userTripStats[uid][gid.toString()] = {
          paid: 0,
          share: 0,
          settledPaid: 0,
          settledReceived: 0,
          paidExpensesCount: 0,
          sharedExpensesCount: 0,
        };
      });
    });

    for (const exp of expenses) {
      totalExpense += exp.amount;
      const gIdStr = exp.groupId.toString();
      if (groupSpending[gIdStr]) {
        groupSpending[gIdStr].count += 1;
        groupSpending[gIdStr].total += exp.amount;
      }

      const payerId = exp.paidBy._id ? exp.paidBy._id.toString() : exp.paidBy.toString();
      if (balances[payerId] !== undefined) {
        balances[payerId] += exp.amount;
      } else {
        balances[payerId] = exp.amount;
      }

      if (!userTripStats[payerId]) {
        userTripStats[payerId] = {};
      }
      if (!userTripStats[payerId][gIdStr]) {
        userTripStats[payerId][gIdStr] = {
          paid: 0,
          share: 0,
          settledPaid: 0,
          settledReceived: 0,
          paidExpensesCount: 0,
          sharedExpensesCount: 0,
        };
      }
      userTripStats[payerId][gIdStr].paid += exp.amount;
      userTripStats[payerId][gIdStr].paidExpensesCount += 1;

      for (const split of exp.splitAmong) {
        const splitUserId = split.user.toString();
        if (balances[splitUserId] !== undefined) {
          balances[splitUserId] -= split.amount;
        } else {
          balances[splitUserId] = -split.amount;
        }

        if (!userTripStats[splitUserId]) {
          userTripStats[splitUserId] = {};
        }
        if (!userTripStats[splitUserId][gIdStr]) {
          userTripStats[splitUserId][gIdStr] = {
            paid: 0,
            share: 0,
            settledPaid: 0,
            settledReceived: 0,
            paidExpensesCount: 0,
            sharedExpensesCount: 0,
          };
        }
        userTripStats[splitUserId][gIdStr].share += split.amount;
        userTripStats[splitUserId][gIdStr].sharedExpensesCount += 1;
      }
    }

    // 2. Process all settlements across all groups in this cluster
    const settlements = await Settlement.find({ groupId: { $in: groupIds } });
    for (const set of settlements) {
      const payerId = set.payer.toString();
      const receiverId = set.receiver.toString();
      const gIdStr = set.groupId.toString();

      if (balances[payerId] !== undefined) {
        balances[payerId] += set.amount;
      }
      if (balances[receiverId] !== undefined) {
        balances[receiverId] -= set.amount;
      }

      if (!userTripStats[payerId]) {
        userTripStats[payerId] = {};
      }
      if (!userTripStats[payerId][gIdStr]) {
        userTripStats[payerId][gIdStr] = {
          paid: 0,
          share: 0,
          settledPaid: 0,
          settledReceived: 0,
          paidExpensesCount: 0,
          sharedExpensesCount: 0,
        };
      }
      userTripStats[payerId][gIdStr].settledPaid += set.amount;

      if (!userTripStats[receiverId]) {
        userTripStats[receiverId] = {};
      }
      if (!userTripStats[receiverId][gIdStr]) {
        userTripStats[receiverId][gIdStr] = {
          paid: 0,
          share: 0,
          settledPaid: 0,
          settledReceived: 0,
          paidExpensesCount: 0,
          sharedExpensesCount: 0,
        };
      }
      userTripStats[receiverId][gIdStr].settledReceived += set.amount;
    }

    // Format individual member balance cards across entire trip cluster
    const memberBalances = Object.keys(balances).map((userId) => {
      const rawBalance = balances[userId] || 0;
      let totalPaid = 0;
      let totalShare = 0;
      let totalSettledPaid = 0;
      let totalSettledReceived = 0;

      const trips = cluster.groups.map((grp) => {
        const gId = grp._id.toString();
        const stats = (userTripStats[userId] && userTripStats[userId][gId]) || {
          paid: 0,
          share: 0,
          settledPaid: 0,
          settledReceived: 0,
          paidExpensesCount: 0,
          sharedExpensesCount: 0,
        };

        totalPaid += stats.paid;
        totalShare += stats.share;
        totalSettledPaid += stats.settledPaid;
        totalSettledReceived += stats.settledReceived;

        const netBalance = (stats.paid - stats.share) + (stats.settledPaid - stats.settledReceived);

        return {
          groupId: grp._id,
          groupName: grp.name,
          groupDate: grp.date,
          paid: Math.round(stats.paid * 100) / 100,
          share: Math.round(stats.share * 100) / 100,
          settledPaid: Math.round(stats.settledPaid * 100) / 100,
          settledReceived: Math.round(stats.settledReceived * 100) / 100,
          netBalance: Math.round(netBalance * 100) / 100,
          paidExpensesCount: stats.paidExpensesCount || 0,
          sharedExpensesCount: stats.sharedExpensesCount || 0,
          isMember: grp.members?.some((m) => (m._id || m).toString() === userId) || false,
        };
      });

      return {
        user: memberMap[userId] || { _id: userId, name: 'Traveler' },
        balance: Math.round(rawBalance * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalShare: Math.round(totalShare * 100) / 100,
        totalSettledPaid: Math.round(totalSettledPaid * 100) / 100,
        totalSettledReceived: Math.round(totalSettledReceived * 100) / 100,
        trips,
      };
    });

    // 3. Compute final consolidated debt summary using greedy reduction
    const simplifiedTransactions = simplifyDebts(balances, Object.values(memberMap));

    // Group breakdown data
    const groupBreakdown = cluster.groups.map((grp) => {
      const gId = grp._id.toString();
      const stats = groupSpending[gId] || { count: 0, total: 0 };
      return {
        _id: grp._id,
        name: grp.name,
        date: grp.date,
        memberCount: grp.members?.length || 0,
        expenseCount: stats.count,
        totalSpent: Math.round(stats.total * 100) / 100,
      };
    });

    res.json({
      totalExpense: Math.round(totalExpense * 100) / 100,
      memberBalances,
      simplifiedTransactions,
      groupBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/clusters/:id
// @desc    Update a trip cluster (name, description, groups)
export const updateCluster = async (req, res) => {
  try {
    const { name, description, groups, image } = req.body;
    const cluster = await Cluster.findById(req.params.id);

    if (!cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    if (cluster.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only cluster creator can edit this cluster' });
    }

    if (name && name.trim() !== '') {
      cluster.name = name.trim();
    }
    if (description !== undefined) {
      cluster.description = description.trim();
    }
    if (image !== undefined) {
      cluster.image = typeof image === 'string' ? image.trim() : '';
    }
    if (Array.isArray(groups)) {
      if (groups.length === 0) {
        return res.status(400).json({ message: 'Cluster must have at least one circle/group' });
      }
      cluster.groups = groups;
    }

    await cluster.save();

    const updated = await Cluster.findById(cluster._id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'groups',
        select: 'name description date members',
        populate: { path: 'members', select: 'name email' },
      });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/clusters/:id
// @desc    Delete a trip cluster (groups remain intact)
export const deleteCluster = async (req, res) => {
  try {
    const cluster = await Cluster.findById(req.params.id);

    if (!cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    if (cluster.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only cluster creator can delete this cluster' });
    }

    await Cluster.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cluster removed successfully. Daily groups remain intact.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
