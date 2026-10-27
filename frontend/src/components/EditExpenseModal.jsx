import { useState } from 'react';
import { updateExpense, deleteExpense } from '../services/api.js';

const CATEGORIES = ['Food', 'Travel', 'Stay', 'Groceries', 'Shopping', 'Entertainment', 'Other'];

export default function EditExpenseModal({ expense, group, onClose, onExpenseUpdated, onExpenseDeleted }) {
  const [description, setDescription] = useState(expense.description || '');
  const [amount, setAmount] = useState(expense.amount ? expense.amount.toString() : '');
  const [category, setCategory] = useState(expense.category || 'Food');
  const [paidBy, setPaidBy] = useState(
    expense.paidBy?._id || expense.paidBy || group.members[0]?._id || ''
  );
  const [date, setDate] = useState(
    expense.date
      ? new Date(expense.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  // Initial selected members from splitAmong
  const initialSelected = expense.splitAmong?.map((s) => s.user?._id || s.user) || group.members.map((m) => m._id);
  const [selectedMembers, setSelectedMembers] = useState(initialSelected);

  // Check if initial split was custom or equal
  const initialAmounts = {};
  let isInitiallyCustom = false;
  if (expense.splitAmong && expense.splitAmong.length > 0) {
    const firstAmount = expense.splitAmong[0].amount;
    expense.splitAmong.forEach((s) => {
      const uId = s.user?._id || s.user;
      initialAmounts[uId] = s.amount;
      if (Math.abs(s.amount - firstAmount) > 0.05) {
        isInitiallyCustom = true;
      }
    });
  }

  const [splitMode, setSplitMode] = useState(isInitiallyCustom ? 'custom' : 'equal');
  const [customAmounts, setCustomAmounts] = useState(initialAmounts);
  const [lockedMembers, setLockedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const parsedAmount = parseFloat(amount) || 0;

  // Calculate equal share
  const perPersonEqual =
    parsedAmount > 0 && selectedMembers.length > 0
      ? (parsedAmount / selectedMembers.length).toFixed(2)
      : '0.00';

  const initializeCustomShares = () => {
    const share = selectedMembers.length > 0 ? parsedAmount / selectedMembers.length : 0;
    const initial = {};
    selectedMembers.forEach((id) => {
      initial[id] = Math.round(share * 100) / 100;
    });
    setCustomAmounts(initial);
    setLockedMembers([]);
  };

  const handleSwitchToCustom = () => {
    setSplitMode('custom');
    if (Object.keys(customAmounts).length === 0) {
      initializeCustomShares();
    }
  };

  const handleMemberToggle = (memberId) => {
    let updated;
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length === 1) return; // Keep at least 1 person
      updated = selectedMembers.filter((id) => id !== memberId);
    } else {
      updated = [...selectedMembers, memberId];
    }
    setSelectedMembers(updated);

    if (splitMode === 'custom' && updated.length > 0) {
      const newShare = parsedAmount > 0 ? parsedAmount / updated.length : 0;
      const newCustom = {};
      updated.forEach((id) => {
        newCustom[id] = Math.round(newShare * 100) / 100;
      });
      setCustomAmounts(newCustom);
      setLockedMembers([]);
    }
  };

  const handleCustomAmountChange = (memberId, newRawVal) => {
    const val = parseFloat(newRawVal) || 0;
    const nextLocked = lockedMembers.includes(memberId) ? lockedMembers : [...lockedMembers, memberId];
    const newAmounts = { ...customAmounts, [memberId]: newRawVal };
    const unlocked = selectedMembers.filter((id) => !nextLocked.includes(id));

    if (unlocked.length > 0) {
      const lockedTotal = nextLocked.reduce((sum, id) => {
        const itemVal = id === memberId ? val : parseFloat(newAmounts[id]) || 0;
        return sum + itemVal;
      }, 0);

      const remainder = Math.max(0, parsedAmount - lockedTotal);
      const splitRemainder = Math.round((remainder / unlocked.length) * 100) / 100;

      unlocked.forEach((id) => {
        newAmounts[id] = splitRemainder;
      });
    }

    setCustomAmounts(newAmounts);
    setLockedMembers(nextLocked);
  };

  const totalCustomAssigned = selectedMembers.reduce((sum, id) => {
    return sum + (parseFloat(customAmounts[id]) || 0);
  }, 0);

  const customDifference = Math.round((parsedAmount - totalCustomAssigned) * 100) / 100;
  const isCustomBalanced = Math.abs(customDifference) <= 0.05;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim() || parsedAmount <= 0) {
      setError('Please provide a valid description and amount.');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('At least one member must be included in the split.');
      return;
    }

    let splitAmong = [];
    if (splitMode === 'equal') {
      const perPersonShare = Math.round((parsedAmount / selectedMembers.length) * 100) / 100;
      splitAmong = selectedMembers.map((userId) => ({
        user: userId,
        amount: perPersonShare,
      }));
    } else {
      if (!isCustomBalanced) {
        setError(
          `Custom amounts total ₹${totalCustomAssigned.toFixed(2)}, but expense is ₹${parsedAmount.toFixed(
            2
          )}. Difference: ₹${customDifference.toFixed(2)}`
        );
        return;
      }
      splitAmong = selectedMembers.map((userId) => ({
        user: userId,
        amount: parseFloat(customAmounts[userId]) || 0,
      }));
    }

    try {
      setLoading(true);
      await updateExpense(expense._id, {
        description: description.trim(),
        amount: parsedAmount,
        category,
        paidBy,
        date,
        splitAmong,
      });
      onExpenseUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteExpense(expense._id);
      if (onExpenseDeleted) onExpenseDeleted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#ece4d6]">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✏️</span>
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900">
                Edit Expense
              </h2>
              <p className="text-[11px] text-stone-500">
                Modify transaction details and adjust split shares
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md text-lg transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 text-xs sm:text-sm custom-scrollbar">
          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-stone-700 mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Fishermans Wharf"
                required
                className="w-full bg-[#f6efe4] border border-[#d8cebd] focus:border-stone-800 focus:outline-none rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[#f6efe4] border border-[#d8cebd] focus:border-stone-800 focus:outline-none rounded-xl px-3 py-2 text-stone-900 font-mono text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Category, Date & Paid By */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#f6efe4] border border-[#d8cebd] focus:border-stone-800 focus:outline-none rounded-xl px-3 py-2 text-stone-900 text-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Expense Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#f6efe4] border border-[#d8cebd] focus:border-stone-800 focus:outline-none rounded-xl px-3 py-2 text-stone-900 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full bg-[#f6efe4] border border-[#d8cebd] focus:border-stone-800 focus:outline-none rounded-xl px-3 py-2 text-stone-900 text-xs"
              >
                {group.members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Mode Selector */}
          <div className="pt-2 border-t border-[#ece4d6]">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-stone-800 text-xs">
                Split Distribution ({selectedMembers.length} Members)
              </label>
              <div className="flex items-center space-x-1 bg-[#ede4d4] p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    splitMode === 'equal'
                      ? 'bg-stone-800 text-[#fbf9f4] shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  Equally (₹{perPersonEqual}/ea)
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToCustom}
                  className={`px-2.5 py-1 rounded-md transition ${
                    splitMode === 'custom'
                      ? 'bg-stone-800 text-[#fbf9f4] shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Split Breakdown List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {group.members.map((member) => {
                const isSelected = selectedMembers.includes(member._id);
                return (
                  <div
                    key={member._id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition ${
                      isSelected
                        ? 'bg-[#f7f1e6] border-[#dacdb9]'
                        : 'bg-[#fbf9f4]/60 border-transparent opacity-60'
                    }`}
                  >
                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMemberToggle(member._id)}
                        className="rounded text-stone-800 focus:ring-0"
                      />
                      <span className="text-xs font-medium text-stone-800">{member.name}</span>
                    </label>

                    {isSelected && (
                      <div className="flex items-center space-x-1.5">
                        {splitMode === 'equal' ? (
                          <span className="text-xs font-mono font-semibold text-stone-800 bg-[#ede4d4] px-2 py-0.5 rounded-md">
                            ₹{perPersonEqual}
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="text-[11px] text-stone-500 font-mono">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={customAmounts[member._id] ?? ''}
                              onChange={(e) =>
                                handleCustomAmountChange(member._id, e.target.value)
                              }
                              className="w-20 bg-[#fbf9f4] border border-[#d8cebd] rounded-lg px-2 py-0.5 text-xs text-right font-mono text-stone-900 focus:outline-none focus:border-stone-800"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {splitMode === 'custom' && (
              <div
                className={`mt-2 p-2 rounded-lg text-xs flex justify-between items-center ${
                  isCustomBalanced
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <span>Total Assigned: ₹{totalCustomAssigned.toFixed(2)}</span>
                <span>
                  {isCustomBalanced
                    ? '✓ Perfectly Balanced'
                    : `Difference: ₹${customDifference.toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#ece4d6] flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {showConfirmDelete ? (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-rose-700 font-medium">Delete this expense?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs px-2.5 py-1 rounded-lg transition"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="text-stone-600 hover:text-stone-900 text-xs px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-rose-700 hover:text-rose-800 text-xs font-semibold flex items-center space-x-1 underline self-start sm:self-auto"
              >
                <span>🗑️</span>
                <span>Delete Expense</span>
              </button>
            )}

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-[#ede5d6] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (splitMode === 'custom' && !isCustomBalanced)}
                className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-[#fbf9f4] text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
