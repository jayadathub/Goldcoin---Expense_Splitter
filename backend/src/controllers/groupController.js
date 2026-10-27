import { Expense } from '../models/Expense.js';
import { Settlement } from '../models/Settlement.js';
import { Cluster } from '../models/Cluster.js';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';

// @route   POST /api/groups
// @desc    Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, date, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const initialMembers = [req.user._id];
    if (Array.isArray(members)) {
      members.forEach((mId) => {
        if (mId && !initialMembers.some((id) => id.toString() === mId.toString())) {
          initialMembers.push(mId);
        }
      });
    }

    const group = await Group.create({
      name,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
      members: initialMembers,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/groups/recent-members
// @desc    Get all distinct members from user's other groups as suggestions
export const getRecentMembers = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate('members', 'name email');
    const memberMap = new Map();

    groups.forEach((group) => {
      group.members.forEach((member) => {
        if (member._id.toString() !== req.user._id.toString()) {
          memberMap.set(member._id.toString(), {
            _id: member._id,
            name: member.name,
            email: member.email,
          });
        }
      });
    });

    res.json(Array.from(memberMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/groups
// @desc    Get all groups the logged-in user belongs to
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/groups/:id
// @desc    Get group details by ID (must be a member)
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check membership authorization
    const isMember = group.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/groups/:id/invite
// @desc    Invite/add a member to group by email
export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Member email is required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if requester is a member of the group
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member to invite others' });
    }

    // Find the user to add
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({ message: 'No registered user found with that email' });
    }

    // Check if already in group
    const alreadyMember = group.members.some(
      (m) => m.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    group.members.push(userToAdd._id);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json({
      message: `${userToAdd.name} added to the group`,
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/groups/:id
// @desc    Update group name and description
export const updateGroup = async (req, res) => {
  try {
    const { name, description, date } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name cannot be empty' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check membership authorization
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Only group members can edit this group' });
    }

    group.name = name.trim();
    if (description !== undefined) {
      group.description = description.trim();
    }
    if (date) {
      group.date = new Date(date);
    }

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json({
      message: 'Group updated successfully',
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @route   DELETE /api/groups/:id
// @desc    Delete a group, its expenses, settlements, and remove from any trip clusters
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only group creator or members can delete
    const isCreator = group.createdBy && group.createdBy.toString() === req.user._id.toString();
    const isMember = group.members.some((m) => m.toString() === req.user._id.toString());

    if (!isCreator && !isMember) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    // 1. Delete all expenses associated with this group
    await Expense.deleteMany({ groupId: id });

    // 2. Delete all settlements associated with this group
    await Settlement.deleteMany({ groupId: id });

    // 3. Remove group reference from any trip clusters
    await Cluster.updateMany({ groups: id }, { $pull: { groups: id } });

    // 4. Delete the group itself
    await Group.findByIdAndDelete(id);

    res.json({ message: 'Group and its associated records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
