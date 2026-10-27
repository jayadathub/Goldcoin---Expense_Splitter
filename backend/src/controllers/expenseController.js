import { Group } from '../models/Group.js';
import { Expense } from '../models/Expense.js';
import { Settlement } from '../models/Settlement.js';
import { simplifyDebts } from '../utils/simplifyDebts.js';

// @route   POST /api/expenses
// @desc    Add a new expense in a group
export const addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, category, paidBy, splitAmong } = req.body;

    if (!groupId || !description || !amount) {
      return res.status(400).json({ message: 'Group, description, and amount are required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Authorization: User must be a member of the group
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Only group members can add expenses' });
    }

    const payer = paidBy || req.user._id;

    // Default split: if splitAmong not provided, split equally among all group members
    let finalSplit = splitAmong;
    if (!finalSplit || finalSplit.length === 0) {
      const perPersonShare = Math.round((Number(amount) / group.members.length) * 100) / 100;
      finalSplit = group.members.map((memberId) => ({
        user: memberId,
        amount: perPersonShare,
      }));
    }

    const expense = await Expense.create({
      groupId,
      description,
      amount: Number(amount),
      category: category || 'General',
      paidBy: payer,
      splitAmong: finalSplit,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a group with optional filters (category, date range, person)
export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { category, startDate, endDate, userId } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Gating: Must be group member
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a group member' });
    }

    const filter = { groupId };

    // Filter by Category
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Filter by Date Range
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Filter by person involved or payer
    if (userId) {
      filter.$or = [{ paidBy: userId }, { 'splitAmong.user': userId }];
    }

    const expenses = await Expense.find(filter)
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/expenses/group/:groupId/balances
// @desc    Calculate net balance for each member and simplified debts
export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Membership check
    const isMember = group.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Initialize balance for each member: balance = 0
    // positive balance => they are owed money
    // negative balance => they owe money
    const balances = {};
    group.members.forEach((member) => {
      balances[member._id.toString()] = 0;
    });

    const userStats = {};
    group.members.forEach((m) => {
      userStats[m._id.toString()] = { paid: 0, share: 0, settledPaid: 0, settledReceived: 0 };
    });

    // 1. Process all expenses
    const expenses = await Expense.find({ groupId });
    for (const exp of expenses) {
      const payerId = exp.paidBy.toString();
      if (balances[payerId] !== undefined) {
        balances[payerId] += exp.amount;
      }
      if (userStats[payerId]) {
        userStats[payerId].paid += exp.amount;
      }

      for (const split of exp.splitAmong) {
        const splitUserId = split.user.toString();
        if (balances[splitUserId] !== undefined) {
          balances[splitUserId] -= split.amount;
        }
        if (userStats[splitUserId]) {
          userStats[splitUserId].share += split.amount;
        }
      }
    }

    // 2. Process all settlements (settle ups)
    const settlements = await Settlement.find({ groupId });
    for (const set of settlements) {
      const payerId = set.payer.toString();
      const receiverId = set.receiver.toString();

      if (balances[payerId] !== undefined) {
        balances[payerId] += set.amount;
      }
      if (balances[receiverId] !== undefined) {
        balances[receiverId] -= set.amount;
      }

      if (userStats[payerId]) {
        userStats[payerId].settledPaid += set.amount;
      }
      if (userStats[receiverId]) {
        userStats[receiverId].settledReceived += set.amount;
      }
    }

    // Format individual member balance cards
    const memberBalances = group.members.map((member) => {
      const idStr = member._id.toString();
      const rawBalance = balances[idStr] || 0;
      const stats = userStats[idStr] || { paid: 0, share: 0, settledPaid: 0, settledReceived: 0 };
      return {
        user: member,
        balance: Math.round(rawBalance * 100) / 100,
        totalPaid: Math.round(stats.paid * 100) / 100,
        totalShare: Math.round(stats.share * 100) / 100,
        totalSettledPaid: Math.round(stats.settledPaid * 100) / 100,
        totalSettledReceived: Math.round(stats.settledReceived * 100) / 100,
      };
    });

    // 3. Calculate simplified debt transactions using greedy algorithm
    const simplifiedTransactions = simplifyDebts(balances, group.members);

    res.json({
      memberBalances,
      simplifiedTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/expenses/:id
// @desc    Update an existing expense in a group
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, paidBy, splitAmong, date } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is a member of the group
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Only group members can edit expenses' });
    }

    if (description !== undefined) expense.description = description.trim();
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category;
    if (paidBy !== undefined) expense.paidBy = paidBy;
    if (date !== undefined) expense.date = new Date(date);

    if (Array.isArray(splitAmong) && splitAmong.length > 0) {
      expense.splitAmong = splitAmong;
    } else if (amount !== undefined) {
      // If splitAmong not explicitly passed but amount changed, re-split equally among existing participants
      const currentParticipants = expense.splitAmong.map((s) => s.user);
      const perPerson = Math.round((Number(amount) / currentParticipants.length) * 100) / 100;
      expense.splitAmong = currentParticipants.map((u) => ({
        user: u,
        amount: perPerson,
      }));
    }

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense from a group
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Only group members can delete expenses' });
    }

    await Expense.findByIdAndDelete(id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

