import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import BalanceSummary from '../components/BalanceSummary.jsx';
import SimplifiedDebts from '../components/SimplifiedDebts.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import AddExpenseModal from '../components/AddExpenseModal.jsx';
import SettleModal from '../components/SettleModal.jsx';
import InviteMemberModal from '../components/InviteMemberModal.jsx';
import EditGroupModal from '../components/EditGroupModal.jsx';
import EditExpenseModal from '../components/EditExpenseModal.jsx';
import {
  getGroupById,
  getGroupBalances,
  getGroupExpenses,
} from '../services/api.js';

export default function GroupDetailsPage() {
  const { id: groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [memberBalances, setMemberBalances] = useState([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState(null);

  // Active Tab: 'debts' | 'expenses' | 'balances'
  const [activeTab, setActiveTab] = useState('debts');

  const fetchAllGroupData = async (filterParams = {}) => {
    try {
      setLoading(true);
      const [groupRes, balancesRes, expensesRes] = await Promise.all([
        getGroupById(groupId),
        getGroupBalances(groupId),
        getGroupExpenses(groupId, filterParams),
      ]);

      setGroup(groupRes.data);
      setMemberBalances(balancesRes.data.memberBalances || []);
      setSimplifiedDebts(balancesRes.data.simplifiedTransactions || []);
      setExpenses(expensesRes.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllGroupData();
  }, [groupId]);

  const handleFilterExpenses = async (params) => {
    try {
      const res = await getGroupExpenses(groupId, params);
      setExpenses(res.data);
    } catch (err) {
      console.error('Filter error:', err);
    }
  };

  const handleQuickSettle = (transaction) => {
    setSettlePrefill(transaction);
    setShowSettleModal(true);
  };

  if (loading && !group) {
    return (
      <div className="min-h-screen bg-[#fbf9f4] flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center text-stone-500 text-sm">
          ⏳ Loading circle details...
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-[#fbf9f4] flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto mt-12 p-6 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-center">
          <p className="font-semibold text-sm">{error}</p>
          <Link to="/" className="mt-4 inline-block text-stone-700 underline text-xs">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-800 flex flex-col selection:bg-[#e7dcce]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-5 flex-1 w-full space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900 transition flex items-center space-x-1">
            <span>🏡</span>
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-stone-800 font-medium truncate">{group.name}</span>
        </div>

        {/* Group Header Card in Warm Cream & Beige */}
        <div className="bg-[#f5efe4] border border-[#e5dccf] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-2xl p-1.5 bg-[#eae0cf] rounded-lg">🎒</span>
              <h1 className="font-serif-quote font-bold text-2xl sm:text-3xl text-stone-900">
                {group.name}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
              {group.description || 'Shared expense circle for harmonious settlements.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">
              <span className="bg-[#ede4d4] text-stone-800 px-2.5 py-1 rounded-full font-medium border border-[#decfa8]">
                👥 {group.members?.length} Members
              </span>
              <span className="bg-[#ede4d4] text-stone-800 px-2.5 py-1 rounded-full font-medium border border-[#decfa8]">
                📅 {new Date(group.date || group.createdAt).toLocaleDateString()}
              </span>
              <span className="text-stone-500">
                Created by <strong className="text-stone-700">{group.createdBy?.name}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <span>✨</span>
              <span>Add Expense</span>
            </button>
            <button
              onClick={() => {
                setSettlePrefill(null);
                setShowSettleModal(true);
              }}
              className="bg-[#435e4d] hover:bg-[#354b3d] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <span>🤝</span>
              <span>Settle Up</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-800 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-3xs flex items-center space-x-1"
            >
              <span>✉️</span>
              <span>Invite</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-800 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-3xs flex items-center space-x-1"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e2d8c9] space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('debts')}
            className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'debts'
                ? 'border-stone-800 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>⚖️</span>
            <span>Debt Summary ({simplifiedDebts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'balances'
                ? 'border-stone-800 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>📊</span>
            <span>Net Balances ({memberBalances.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'expenses'
                ? 'border-stone-800 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>📜</span>
            <span>Expense Ledger ({expenses.length})</span>
          </button>
        </div>

        {/* Tab 1: Simplified Debts */}
        {activeTab === 'debts' && (
          <div className="bg-[#f6efe4] border border-[#e6dcce] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900 flex items-center space-x-2">
                <span>🌱</span>
                <span>Debt Summary</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Calculated via greedy matching algorithm to reduce N pairwise balances into the fewest possible transactions.
              </p>
            </div>
            <SimplifiedDebts
              transactions={simplifiedDebts}
              onQuickSettle={handleQuickSettle}
            />
          </div>
        )}

        {/* Tab 2: Individual Member Balances */}
        {activeTab === 'balances' && (
          <div className="bg-[#f6efe4] border border-[#e6dcce] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900 flex items-center space-x-2">
                <span>👥</span>
                <span>Member Ledger Balances</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Positive values show who receives money; negative shows who owes.
              </p>
            </div>
            <BalanceSummary memberBalances={memberBalances} clusterName={group?.name} />
          </div>
        )}

        {/* Tab 3: Expense History with Filters */}
        {activeTab === 'expenses' && (
          <div className="bg-[#f6efe4] border border-[#e6dcce] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900 flex items-center space-x-2">
                <span>🔍</span>
                <span>Filterable Expense History</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Filter by category, involved member, or specific date range.
              </p>
            </div>
            <ExpenseList
              expenses={expenses}
              members={group.members}
              onFilterChange={handleFilterExpenses}
              onEditExpense={(exp) => setEditingExpense(exp)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {showExpenseModal && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowExpenseModal(false)}
          onExpenseAdded={fetchAllGroupData}
        />
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          group={group}
          onClose={() => setEditingExpense(null)}
          onExpenseUpdated={fetchAllGroupData}
          onExpenseDeleted={fetchAllGroupData}
        />
      )}

      {showSettleModal && (
        <SettleModal
          group={group}
          prefill={settlePrefill}
          simplifiedDebts={simplifiedDebts}
          onClose={() => setShowSettleModal(false)}
          onSettled={fetchAllGroupData}
        />
      )}

      {showInviteModal && (
        <InviteMemberModal
          groupId={group._id}
          existingMembers={group.members}
          onClose={() => setShowInviteModal(false)}
          onMemberAdded={fetchAllGroupData}
        />
      )}

      {showEditModal && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditModal(false)}
          onGroupUpdated={fetchAllGroupData}
        />
      )}
    </div>
  );
}
