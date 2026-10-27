import { useState } from 'react';

const CATEGORIES = ['All', 'Food', 'Travel', 'Stay', 'Groceries', 'Shopping', 'Entertainment', 'Other'];

const getCategoryEmoji = (category = '') => {
  switch (category.toLowerCase()) {
    case 'food':
      return '☕';
    case 'travel':
      return '✈️';
    case 'stay':
      return '🏡';
    case 'groceries':
      return '🛒';
    case 'shopping':
      return '🛍️';
    case 'entertainment':
      return '🎬';
    default:
      return '🍃';
  }
};

export default function ExpenseList({
  expenses = [],
  members = [],
  onFilterChange,
  onEditExpense,
}) {
  const [category, setCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');

  const handleApplyFilter = (e) => {
    e.preventDefault();
    onFilterChange({
      category: category === 'All' ? undefined : category,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId || undefined,
    });
  };

  const handleResetFilter = () => {
    setCategory('All');
    setStartDate('');
    setEndDate('');
    setUserId('');
    onFilterChange({});
  };

  return (
    <div className="space-y-4">
      {/* Filters Form */}
      <form
        onSubmit={handleApplyFilter}
        className="bg-[#fbf9f4] border border-[#e2d8c9] rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs shadow-3xs"
      >
        <div>
          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-stone-600"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Member Involved</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-stone-600"
          >
            <option value="">All Members</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-600 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-stone-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-600 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-stone-600"
          />
        </div>

        <div className="sm:col-span-2 md:col-span-4 flex justify-end space-x-2 pt-2 border-t border-[#ede4d6]">
          <button
            type="button"
            onClick={handleResetFilter}
            className="px-3 py-1 bg-[#ede4d4] border border-[#d8cebd] text-stone-700 rounded-lg hover:bg-[#e4d8c6] text-xs font-medium transition"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-3.5 py-1 bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] rounded-lg text-xs font-medium transition"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Expenses Table/Cards */}
      {expenses.length === 0 ? (
        <p className="text-stone-500 italic text-center py-6 text-xs">
          No expenses recorded matching this filter.
        </p>
      ) : (
        <div className="space-y-2.5">
          {expenses.map((expense) => {
            const emoji = getCategoryEmoji(expense.category);

            return (
              <div
                key={expense._id}
                className="bg-[#fbf9f4] border border-[#e2d8c9] rounded-xl p-3.5 shadow-3xs flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:border-[#cfc1ad] transition"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base p-1 bg-[#ede4d4] rounded-md">{emoji}</span>
                    <h4 className="font-semibold text-stone-900 text-sm">{expense.description}</h4>
                    <span className="text-[10px] bg-[#ede4d4] text-stone-700 px-2 py-0.5 rounded-full font-medium">
                      {expense.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Paid by <strong className="text-stone-700">{expense.paidBy?.name}</strong> •{' '}
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                  </p>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Split with: {expense.splitAmong?.map((s) => s.user?.name).filter(Boolean).join(', ')}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <span className="text-base sm:text-lg font-bold font-mono text-stone-900 bg-[#ede4d4] px-2.5 py-1 rounded-lg">
                    ₹{expense.amount.toFixed(2)}
                  </span>
                  {onEditExpense && (
                    <button
                      type="button"
                      onClick={() => onEditExpense(expense)}
                      title="Edit this expense"
                      className="p-1.5 rounded-lg bg-[#ede4d4] hover:bg-[#e4d7c3] border border-[#d8cdbc] text-stone-700 text-xs transition shadow-3xs flex items-center space-x-1"
                    >
                      <span>✏️</span>
                      <span className="text-[11px] font-medium hidden sm:inline">Edit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
