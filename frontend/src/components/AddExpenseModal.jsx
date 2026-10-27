import { useState, useEffect } from 'react';
import { addExpense } from '../services/api.js';

const CATEGORIES = ['Food', 'Travel', 'Stay', 'Groceries', 'Shopping', 'Entertainment', 'Other'];

export default function AddExpenseModal({ group, onClose, onExpenseAdded }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState(group.members[0]?._id || '');
  const [selectedMembers, setSelectedMembers] = useState(
    group.members.map((m) => m._id)
  );

  // Split mode: 'equal' (default) vs 'custom'
  const [splitMode, setSplitMode] = useState('equal');
  const [customAmounts, setCustomAmounts] = useState({});
  const [lockedMembers, setLockedMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Small Calculator state
  const [showCalc, setShowCalc] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('');

  const parsedAmount = parseFloat(amount) || 0;

  // Calculate equal share
  const perPersonEqual =
    parsedAmount > 0 && selectedMembers.length > 0
      ? (parsedAmount / selectedMembers.length).toFixed(2)
      : '0.00';

  // Update custom shares whenever switching to custom or resetting
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
    initializeCustomShares();
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

    // If in custom mode, recalculate unlocked members
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

  // When a user types a custom amount for a member:
  // Automatically distribute the remainder to other unlocked members
  const handleCustomAmountChange = (memberId, newRawVal) => {
    const val = parseFloat(newRawVal) || 0;

    // Track this member as locked/customized
    const nextLocked = lockedMembers.includes(memberId)
      ? lockedMembers
      : [...lockedMembers, memberId];

    // Compute remaining amount for unlocked members
    const newAmounts = { ...customAmounts, [memberId]: newRawVal };

    // Other selected members that aren't locked
    const unlocked = selectedMembers.filter((id) => !nextLocked.includes(id));

    if (unlocked.length > 0) {
      // Sum of all locked members
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

    setLockedMembers(nextLocked);
    setCustomAmounts(newAmounts);
  };

  // Safe arithmetic evaluator for calculator
  const calculateResult = (expr) => {
    try {
      const cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!cleanExpr.trim()) return '';
      if (!/^[0-9+\-*/. ()]+$/.test(cleanExpr)) return 'Error';
      const evaluated = Function(`'use strict'; return (${cleanExpr})`)();
      if (typeof evaluated === 'number' && !isNaN(evaluated) && isFinite(evaluated)) {
        return (Math.round(evaluated * 100) / 100).toString();
      }
      return 'Error';
    } catch {
      return 'Error';
    }
  };

  const handleCalcBtnClick = (val) => {
    if (val === 'C') {
      setCalcExpr('');
      setCalcResult('');
    } else if (val === '=') {
      const res = calculateResult(calcExpr);
      setCalcResult(res);
    } else {
      const next = calcExpr + val;
      setCalcExpr(next);
      const autoCalc = calculateResult(next);
      if (autoCalc && autoCalc !== 'Error') {
        setCalcResult(autoCalc);
      }
    }
  };

  const handleApplyCalc = () => {
    const finalVal = calcResult || calculateResult(calcExpr);
    if (finalVal && finalVal !== 'Error') {
      setAmount(finalVal);
      setShowCalc(false);
      if (splitMode === 'custom') {
        const numVal = parseFloat(finalVal) || 0;
        const share = selectedMembers.length > 0 ? numVal / selectedMembers.length : 0;
        const nextAmounts = {};
        selectedMembers.forEach((id) => {
          nextAmounts[id] = Math.round(share * 100) / 100;
        });
        setCustomAmounts(nextAmounts);
        setLockedMembers([]);
      }
    }
  };

  // Custom split summation
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
      // Custom split validation
      if (!isCustomBalanced) {
        setError(
          `Custom amounts total ₹${totalCustomAssigned.toFixed(
            2
          )}, but expense is ₹${parsedAmount.toFixed(
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
      await addExpense({
        groupId: group._id,
        description,
        amount: parsedAmount,
        category,
        paidBy,
        splitAmong,
      });
      onExpenseAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#ece4d6]">
          <div className="flex items-center space-x-2">
            <span>✨</span>
            <h2 className="font-serif-quote font-bold text-lg text-stone-900">
              Add New Expense
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. Dinner at Rustic Cafe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (splitMode === 'custom') {
                    const newTotal = parseFloat(e.target.value) || 0;
                    const share = selectedMembers.length > 0 ? newTotal / selectedMembers.length : 0;
                    const resetAmounts = {};
                    selectedMembers.forEach((id) => {
                      resetAmounts[id] = Math.round(share * 100) / 100;
                    });
                    setCustomAmounts(resetAmounts);
                    setLockedMembers([]);
                  }
                }}
                className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 font-mono focus:outline-none focus:border-stone-600"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Paid By</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
            >
              {group.members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          {/* Split Section & Mini Calculator */}
          <div className="pt-2 border-t border-[#ece4d6]">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-stone-700">
                Split Among ({selectedMembers.length})
              </label>
              <button
                type="button"
                onClick={() => setShowCalc(!showCalc)}
                className="text-xs bg-[#ede5d6] hover:bg-[#e4dbca] text-stone-800 font-medium px-2 py-1 rounded-lg transition border border-[#d8cebd] flex items-center space-x-1"
              >
                <span>🧮</span>
                <span>{showCalc ? 'Hide Calc' : 'Calculator'}</span>
              </button>
            </div>

            {/* Split Mode Selector: Equal vs Custom */}
            <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-100 text-xs font-semibold mb-2.5">
              <button
                type="button"
                onClick={() => setSplitMode('equal')}
                className={`flex-1 py-1 rounded transition ${
                  splitMode === 'equal'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚖️ Split Equally (Default)
              </button>
              <button
                type="button"
                onClick={handleSwitchToCustom}
                className={`flex-1 py-1 rounded transition ${
                  splitMode === 'custom'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✏️ Custom Split
              </button>
            </div>

            {/* Live Status Banner */}
            {splitMode === 'equal' ? (
              parsedAmount > 0 && (
                <div className="mb-2 bg-blue-50 text-blue-800 text-xs px-2.5 py-1.5 rounded border border-blue-200 flex justify-between items-center">
                  <span>Equally divided:</span>
                  <span className="font-bold">
                    ₹{perPersonEqual} / person ({selectedMembers.length} people)
                  </span>
                </div>
              )
            ) : (
              <div
                className={`mb-2 text-xs px-2.5 py-1.5 rounded border flex justify-between items-center ${
                  isCustomBalanced
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                <span>
                  Assigned: <strong>₹{totalCustomAssigned.toFixed(2)}</strong> / ₹{parsedAmount.toFixed(2)}
                </span>
                <span>
                  {isCustomBalanced ? (
                    '✅ Balanced'
                  ) : customDifference > 0 ? (
                    `Remaining: ₹${customDifference.toFixed(2)}`
                  ) : (
                    `Over by: ₹${Math.abs(customDifference).toFixed(2)}`
                  )}
                </span>
              </div>
            )}

            {/* Mini Calculator Dropdown */}
            {showCalc && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Quick Bill Calculator</span>
                  <span className="text-green-700 font-semibold">
                    {calcResult && calcResult !== 'Error' ? `= ₹${calcResult}` : ''}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 mb-2">
                  <input
                    type="text"
                    value={calcExpr}
                    onChange={(e) => {
                      setCalcExpr(e.target.value);
                      const res = calculateResult(e.target.value);
                      if (res && res !== 'Error') setCalcResult(res);
                    }}
                    placeholder="e.g. 250 + 120 + 85"
                    className="flex-1 bg-white border border-gray-300 rounded px-2.5 py-1 text-sm font-mono text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCalc}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition"
                  >
                    Use Total
                  </button>
                </div>

                {/* Calculator Keypad */}
                <div className="grid grid-cols-4 gap-1 text-xs">
                  {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', 'C', '0', '=', '+'].map(
                    (btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => handleCalcBtnClick(btn)}
                        className={`py-1 rounded font-semibold transition ${
                          btn === 'C'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : btn === '='
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : ['÷', '×', '-', '+'].includes(btn)
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {btn}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Members checkboxes & Custom Input rows */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2 space-y-1.5 bg-white">
              {group.members.map((member) => {
                const isChecked = selectedMembers.includes(member._id);
                const isLocked = lockedMembers.includes(member._id);

                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between text-sm text-gray-700 p-1.5 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleMemberToggle(member._id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </label>

                    {isChecked && (
                      <div className="flex items-center space-x-1">
                        {splitMode === 'equal' ? (
                          <span className="text-xs text-gray-500 font-mono">
                            ₹{perPersonEqual}
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-400">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={customAmounts[member._id] ?? ''}
                              onChange={(e) =>
                                handleCustomAmountChange(member._id, e.target.value)
                              }
                              className={`w-20 px-1.5 py-0.5 text-xs text-right border rounded font-mono text-gray-900 focus:outline-none focus:border-blue-500 ${
                                isLocked
                                  ? 'border-blue-400 bg-blue-50 font-bold'
                                  : 'border-gray-300 bg-white'
                              }`}
                              placeholder="0.00"
                            />
                            {isLocked && (
                              <span
                                title="Customized amount (others auto-adjusted)"
                                className="text-xs text-blue-600 cursor-help"
                              >
                                🔒
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Mode Reset Button */}
            {splitMode === 'custom' && (
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-gray-500 italic">
                  💡 Type any member's share; others adjust automatically.
                </span>
                <button
                  type="button"
                  onClick={initializeCustomShares}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Reset Shares
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#ece4d6]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#d8cdbc] text-stone-700 rounded-lg hover:bg-[#ede5d6] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (splitMode === 'custom' && !isCustomBalanced)}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] rounded-lg text-xs font-medium transition disabled:bg-stone-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
