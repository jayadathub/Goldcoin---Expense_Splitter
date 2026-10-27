import { useState, useMemo } from 'react';
import { createSettlement } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SettleModal({ group, prefill, simplifiedDebts = [], onClose, onSettled }) {
  const { user } = useAuth();
  const currentUserId = (user?._id || user?.id)?.toString();

  // Filter out self so you don't settle with yourself
  const availableMembers = useMemo(() => {
    const list = group?.members || [];
    const filtered = list.filter((m) => (m._id || m.id)?.toString() !== currentUserId);
    return filtered.length > 0 ? filtered : list;
  }, [group, currentUserId]);

  const initialReceiverId = useMemo(() => {
    if (prefill?.to?._id) return prefill.to._id;
    if (typeof prefill?.to === 'string' && prefill.to) return prefill.to;

    // Check if there is an existing debt from current user
    if (simplifiedDebts?.length > 0) {
      const myDebt = simplifiedDebts.find((tx) => {
        const fromId = (tx.from?._id || (typeof tx.from === 'string' ? tx.from : ''))?.toString();
        return fromId === currentUserId;
      });
      if (myDebt) {
        return (myDebt.to?._id || (typeof myDebt.to === 'string' ? myDebt.to : '')) || '';
      }
    }

    return availableMembers[0]?._id || group?.members?.[0]?._id || '';
  }, [prefill, simplifiedDebts, currentUserId, availableMembers, group]);

  const [receiverId, setReceiverId] = useState(initialReceiverId);
  const [amount, setAmount] = useState(prefill?.amount ? prefill.amount.toString() : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find original debt due for the selected receiver
  const originalDebtAmount = useMemo(() => {
    // 1. If prefill is provided and matches the selected receiver
    const prefillToId = (prefill?.to?._id || (typeof prefill?.to === 'string' ? prefill.to : ''))?.toString();
    if (prefill?.amount && prefillToId === receiverId?.toString()) {
      return Number(prefill.amount);
    }

    // 2. Otherwise search in simplifiedDebts for a transaction from logged-in user to receiver
    const match = simplifiedDebts.find((tx) => {
      const toId = (tx.to?._id || (typeof tx.to === 'string' ? tx.to : ''))?.toString();
      const fromId = (tx.from?._id || (typeof tx.from === 'string' ? tx.from : ''))?.toString();
      return toId === receiverId?.toString() && (!currentUserId || fromId === currentUserId);
    });

    if (match?.amount) {
      return Number(match.amount);
    }

    // 3. Fallback: if prefill amount was set regardless of receiver mismatch
    if (prefill?.amount && !prefillToId) {
      return Number(prefill.amount);
    }

    return null;
  }, [prefill, receiverId, simplifiedDebts, currentUserId]);

  const enteredAmount = parseFloat(amount) || 0;
  const remaining = originalDebtAmount !== null ? Math.max(0, originalDebtAmount - enteredAmount) : null;
  const overpaid = originalDebtAmount !== null && enteredAmount > originalDebtAmount ? enteredAmount - originalDebtAmount : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!receiverId || isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid receiver and amount.');
      return;
    }

    try {
      setLoading(true);
      await createSettlement({
        groupId: group._id,
        receiverId,
        amount: numAmount,
      });
      onSettled();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record settlement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#ece4d6]">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🤝</span>
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900">
                Record Settle Up Payment
              </h2>
              <p className="text-[11px] text-stone-500">
                Clear debts or make partial settlement payments
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
          <div className="mb-3 p-2.5 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Paying To (Receiver)</label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-800 text-xs sm:text-sm"
            >
              {availableMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-medium text-stone-700">Amount (₹)</label>
              {originalDebtAmount !== null && (
                <button
                  type="button"
                  onClick={() => setAmount(originalDebtAmount.toString())}
                  className="text-[11px] text-stone-700 hover:text-stone-950 font-semibold underline"
                >
                  Pay Full (₹{originalDebtAmount.toFixed(2)})
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={originalDebtAmount ? originalDebtAmount.toFixed(2) : '0.00'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-xl px-3 py-2 text-stone-900 font-mono focus:outline-none focus:border-stone-800 text-xs sm:text-sm"
              required
            />
          </div>

          {/* Real-time Settlement Balance Breakdown */}
          {originalDebtAmount !== null && originalDebtAmount > 0 && (
            <div className="bg-[#f5eee3] border border-[#d8cdbc] rounded-xl p-3.5 space-y-2 text-xs shadow-3xs">
              <div className="flex justify-between items-center text-stone-600">
                <span>Total Debt Outstanding:</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₹{originalDebtAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span>Paying Now:</span>
                <span className="font-mono font-semibold text-emerald-800">
                  ₹{enteredAmount.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-[#dfd4c3] flex justify-between items-center">
                <span className="font-semibold text-stone-800">Still to be settled:</span>
                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-sm ${
                      remaining === 0 ? 'text-emerald-700' : 'text-stone-900'
                    }`}
                  >
                    ₹{remaining?.toFixed(2)}
                  </span>
                  {remaining === 0 && enteredAmount > 0 && (
                    <span className="block text-[10px] text-emerald-700 font-semibold">
                      (Fully Settled! 🎉)
                    </span>
                  )}
                </div>
              </div>

              {overpaid > 0 && (
                <p className="text-[10px] text-amber-800 italic pt-1 border-t border-[#e2d7c6]">
                  Paying ₹{overpaid.toFixed(2)} more than the recorded debt balance.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#ece4d6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#d8cdbc] text-stone-700 rounded-xl hover:bg-[#ede5d6] text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#435e4d] hover:bg-[#354b3d] text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Confirm Settle Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
