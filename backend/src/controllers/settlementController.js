import { Group } from '../models/Group.js';
import { Settlement } from '../models/Settlement.js';

// @route   POST /api/settlements
// @desc    Record a settlement payment between two members
export const createSettlement = async (req, res) => {
  try {
    const { groupId, receiverId, amount } = req.body;

    if (!groupId || !receiverId || !amount) {
      return res.status(400).json({ message: 'GroupId, receiverId, and amount are required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify current user and receiver are in group
    const isPayerInGroup = group.members.some((m) => m.toString() === req.user._id.toString());
    const isReceiverInGroup = group.members.some((m) => m.toString() === receiverId.toString());

    if (!isPayerInGroup || !isReceiverInGroup) {
      return res.status(400).json({ message: 'Both parties must be members of the group' });
    }

    const settlement = await Settlement.create({
      groupId,
      payer: req.user._id,
      receiver: receiverId,
      amount: Number(amount),
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('payer', 'name email')
      .populate('receiver', 'name email');

    res.status(201).json({
      message: 'Settlement recorded successfully',
      settlement: populatedSettlement,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/settlements/group/:groupId
// @desc    Get all settlement history for a group
export const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify membership
    const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const settlements = await Settlement.find({ groupId })
      .populate('payer', 'name email')
      .populate('receiver', 'name email')
      .sort({ date: -1 });

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
