import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import SimplifiedDebts from '../components/SimplifiedDebts.jsx';
import BalanceSummary from '../components/BalanceSummary.jsx';
import SettleModal from '../components/SettleModal.jsx';
import EditClusterModal from '../components/EditClusterModal.jsx';
import {
  getClusterById,
  getClusterBalances,
  getMyGroups,
} from '../services/api.js';

export default function ClusterDetailsPage() {
  const { id: clusterId } = useParams();
  const navigate = useNavigate();

  const [cluster, setCluster] = useState(null);
  const [balancesData, setBalancesData] = useState({
    totalExpense: 0,
    memberBalances: [],
    simplifiedTransactions: [],
    groupBreakdown: [],
  });
  const [allUserGroups, setAllUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState(null);

  // Active Tab: 'debts' | 'balances' | 'groups'
  const [activeTab, setActiveTab] = useState('debts');

  const fetchClusterData = async () => {
    try {
      setLoading(true);
      const [clusterRes, balancesRes, groupsRes] = await Promise.all([
        getClusterById(clusterId),
        getClusterBalances(clusterId),
        getMyGroups().catch(() => ({ data: [] })),
      ]);

      setCluster(clusterRes.data);
      setBalancesData(balancesRes.data);
      setAllUserGroups(groupsRes.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip cluster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterData();
  }, [clusterId]);

  const handleQuickSettle = (transaction) => {
    setSettlePrefill(transaction);
    setShowSettleModal(true);
  };

  if (loading && !cluster) {
    return (
      <div className="min-h-screen bg-[#fbf9f4] flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center text-stone-500 text-sm">
          ⏳ Consolidating trip cluster ledger...
        </div>
      </div>
    );
  }

  if (error && !cluster) {
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

  const { totalExpense, memberBalances, simplifiedTransactions, groupBreakdown } = balancesData;

  // Choose the first group to anchor settlement if needed
  const anchorGroup = cluster.groups?.[0] || { _id: cluster.groups?.[0]?._id, members: memberBalances.map(m => m.user) };

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
          <span className="text-stone-800 font-medium truncate">Trip Cluster: {cluster.name}</span>
        </div>

        {/* Cluster Header Card with Dynamic Image Backdrop */}
        {(() => {
          const hasImage = Boolean(cluster.image);
          return (
            <div
              className={`rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-300 ${
                hasImage
                  ? 'border border-stone-800/30 text-white shadow-md'
                  : 'bg-[#f5efe4] border border-[#e5dccf] text-stone-800'
              }`}
            >
              {/* Image Backdrop Layer - Sharp & Unblurred */}
              {hasImage && (
                <>
                  <img
                    src={cluster.image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
                  />
                  {/* Clean dark gradient overlay without any blur so the background image remains razor-sharp */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/65 to-stone-950/80 pointer-events-none"
                    aria-hidden="true"
                  />
                </>
              )}

              {/* Foreground Content */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    {cluster.image ? (
                      <img
                        src={cluster.image}
                        alt={cluster.name}
                        className="w-14 h-14 object-cover rounded-2xl shadow-md border-2 border-white/70 shrink-0 bg-stone-900/50 ring-1 ring-black/40"
                      />
                    ) : (
                      <span className="text-3xl p-2 bg-[#eae0cf] rounded-xl shadow-3xs shrink-0">🧳</span>
                    )}
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-0.5 ${
                          hasImage
                            ? 'text-amber-200 bg-amber-950/80 border border-amber-400/50 shadow-xs'
                            : 'text-amber-900 bg-amber-100/70 border border-amber-200'
                        }`}
                      >
                        Trip Cluster Ledger
                      </span>
                      <h1
                        className={`font-serif-quote font-bold text-2xl sm:text-3xl leading-tight ${
                          hasImage ? 'text-white drop-shadow-md' : 'text-stone-900'
                        }`}
                      >
                        {cluster.name}
                      </h1>
                    </div>
                  </div>

                  <p
                    className={`text-xs sm:text-sm max-w-xl leading-relaxed ${
                      hasImage ? 'text-stone-100 drop-shadow-xs font-medium' : 'text-stone-600'
                    }`}
                  >
                    {cluster.description || 'Consolidated balances for multiple trip days.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span
                      className={`px-2.5 py-1 rounded-full font-medium ${
                        hasImage
                          ? 'bg-stone-900/80 text-stone-100 border border-white/25 shadow-xs'
                          : 'bg-[#ede4d4] text-stone-800 border border-[#decfa8]'
                      }`}
                    >
                      📅 {cluster.groups?.length || 0} Clustered Days
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full font-medium ${
                        hasImage
                          ? 'bg-stone-900/80 text-stone-100 border border-white/25 shadow-xs'
                          : 'bg-[#ede4d4] text-stone-800 border border-[#decfa8]'
                      }`}
                    >
                      👥 {memberBalances?.length || 0} Travelers
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold font-mono ${
                        hasImage
                          ? 'bg-emerald-950/85 text-emerald-200 border border-emerald-400/50 shadow-xs'
                          : 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      💰 Total Spent: ₹{totalExpense?.toFixed(2) || '0.00'}
                    </span>
                    <span
                      className={`text-[11px] ${
                        hasImage ? 'text-stone-200 drop-shadow-xs font-medium' : 'text-stone-500'
                      }`}
                    >
                      Organized by{' '}
                      <strong className={hasImage ? 'text-white font-bold' : 'text-stone-700'}>
                        {cluster.createdBy?.name}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                      hasImage
                        ? 'bg-stone-900/75 hover:bg-stone-900 text-white border border-white/30 shadow-xs'
                        : 'bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-800 shadow-3xs'
                    }`}
                  >
                    <span>✏️</span>
                    <span>Edit Cluster</span>
                  </button>
                  <Link
                    to="/"
                    className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center space-x-1 ${
                      hasImage
                        ? 'bg-stone-950 hover:bg-black text-white border border-white/20 shadow-xs'
                        : 'bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] shadow-xs'
                    }`}
                  >
                    <span>← Back to Circles</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

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
            <span>Final Debt Summary ({simplifiedTransactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'balances'
                ? 'border-stone-800 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>👥</span>
            <span>Consolidated Balances ({memberBalances.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'groups'
                ? 'border-stone-800 text-stone-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>📅</span>
            <span>Clustered Days ({groupBreakdown.length})</span>
          </button>
        </div>

        {/* Tab 1: Final Debt Summary across all days */}
        {activeTab === 'debts' && (
          <div className="bg-[#f6efe4] border border-[#e6dcce] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e8dfcf] pb-3">
              <div>
                <h2 className="font-serif-quote font-bold text-lg text-stone-900 flex items-center space-x-2">
                  <span>⚖️</span>
                  <span>Consolidated Final Debt Summary</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Debts across all {cluster.groups?.length} days have been consolidated into the fewest possible payments.
                </p>
              </div>

              <div className="bg-[#ede3d1] border border-[#decfa8] text-stone-800 text-xs px-3 py-1 rounded-lg self-start sm:self-auto font-mono font-semibold">
                {simplifiedTransactions.length} final {simplifiedTransactions.length === 1 ? 'transaction' : 'transactions'}
              </div>
            </div>

            <SimplifiedDebts
              transactions={simplifiedTransactions}
              onQuickSettle={handleQuickSettle}
            />
          </div>
        )}

        {/* Tab 2: Individual Consolidated Member Balances */}
        {activeTab === 'balances' && (
          <div className="bg-[#f6efe4] border border-[#e6dcce] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900 flex items-center space-x-2">
                <span>👥</span>
                <span>Overall Trip Net Balances</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Total amount each traveler receives or owes. Click any traveler to see the breakdown of all trips involved towards their net balance.
              </p>
            </div>
            <BalanceSummary memberBalances={memberBalances} clusterName={cluster?.name} />
          </div>
        )}

        {/* Tab 3: Daily Groups Breakdown */}
        {activeTab === 'groups' && (
          <div className="bg-[#f6efe4] border border-[#e6dcce] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900 flex items-center space-x-2">
                <span>📅</span>
                <span>Daily Circles Breakdown</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Click any day to open its individual daily ledger and view line-by-line expenses.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {groupBreakdown.map((grp) => (
                <div
                  key={grp._id}
                  className="bg-[#fbf9f4] border border-[#e2d8c8] hover:border-[#cfc1ad] rounded-xl p-4 transition shadow-3xs hover:shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-lg p-1 bg-[#ede4d4] rounded-md">🎒</span>
                      <span className="text-[10px] font-mono text-stone-500 bg-[#ede4d4] px-2 py-0.5 rounded">
                        {grp.memberCount} travelers
                      </span>
                    </div>

                    <h3 className="font-serif-quote font-bold text-sm text-stone-900">
                      {grp.name}
                    </h3>

                    <p className="text-[11px] text-stone-500">
                      📅 {new Date(grp.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Total Spent</span>
                      <span className="font-bold font-mono text-stone-800">
                        ₹{grp.totalSpent.toFixed(2)}
                      </span>
                    </div>

                    <Link
                      to={`/group/${grp._id}`}
                      className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] font-semibold text-[11px] px-2.5 py-1.5 rounded-lg transition"
                    >
                      Open Day →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit Cluster Modal */}
      {showEditModal && (
        <EditClusterModal
          cluster={cluster}
          allGroups={allUserGroups}
          onClose={() => setShowEditModal(false)}
          onUpdated={fetchClusterData}
          onDeleted={() => navigate('/')}
        />
      )}

      {/* Settle Modal */}
      {showSettleModal && (
        <SettleModal
          group={anchorGroup}
          prefill={settlePrefill}
          simplifiedDebts={simplifiedTransactions}
          onClose={() => setShowSettleModal(false)}
          onSettled={fetchClusterData}
        />
      )}
    </div>
  );
}
