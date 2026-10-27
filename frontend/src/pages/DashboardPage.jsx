import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import CreateClusterModal from '../components/CreateClusterModal.jsx';
import { getMyGroups, createGroup, getRecentMembers, getMyClusters } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Helper to pick cute category icon for aesthetic group cards
const getGroupEmoji = (name = '', desc = '') => {
  const text = (name + ' ' + desc).toLowerCase();
  if (text.includes('trip') || text.includes('tour') || text.includes('travel') || text.includes('goa'))
    return '✈️';
  if (text.includes('flat') || text.includes('room') || text.includes('rent') || text.includes('home'))
    return '🏡';
  if (text.includes('food') || text.includes('dinner') || text.includes('cafe') || text.includes('party'))
    return '☕';
  if (text.includes('office') || text.includes('project') || text.includes('work'))
    return '💼';
  return '🍃';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'clusters' ? 'clusters' : 'groups';

  const [groups, setGroups] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Active view: 'groups' | 'clusters'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateClusterModal, setShowCreateClusterModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [groupsRes, membersRes, clustersRes] = await Promise.all([
        getMyGroups(),
        getRecentMembers().catch(() => ({ data: [] })),
        getMyClusters().catch(() => ({ data: [] })),
      ]);
      setGroups(groupsRes.data || []);
      setRecentMembers(membersRes.data || []);
      setClusters(clustersRes.data || []);
    } catch (err) {
      setError('Failed to fetch your groups and clusters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'clusters' || tabParam === 'groups') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreateLoading(true);
      await createGroup({ name, description, date, members: selectedMemberIds });
      setName('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedMemberIds([]);
      setShowCreateModal(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter groups and clusters by search term
  const filteredGroups = groups.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      (g.description && g.description.toLowerCase().includes(term))
    );
  });

  const filteredClusters = clusters.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-800 flex flex-col selection:bg-[#e7dcce]">
      <Navbar onOpenCreateGroup={() => setShowCreateModal(true)} />

      <main className="max-w-6xl mx-auto px-4 py-5 flex-1 w-full space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900 transition flex items-center space-x-1">
            <span>🏡</span>
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-stone-800 font-medium">All Circles & Clusters Dashboard</span>
        </div>

        {/* Dashboard Header Banner */}
        <div className="bg-[#f5efe4] border border-[#e5dccf] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl p-2 bg-[#eae0cf] rounded-xl shadow-3xs">📚</span>
              <h1 className="font-serif-quote font-bold text-2xl sm:text-3xl text-stone-900">
                All Circles & Clusters Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
              Complete catalog of all your shared expense circles and multi-day trip clusters.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">
              <span className="bg-[#ede4d4] text-stone-800 px-2.5 py-1 rounded-md font-semibold border border-[#d8cdbc]">
                🎒 {groups.length} Circles Total
              </span>
              <span className="bg-[#ede4d4] text-stone-800 px-2.5 py-1 rounded-md font-semibold border border-[#d8cdbc]">
                🧳 {clusters.length} Trip Clusters Total
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <span>✨</span>
              <span>New Group</span>
            </button>
            <button
              onClick={() => setShowCreateClusterModal(true)}
              className="bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-3xs flex items-center space-x-1.5"
            >
              <span>🧳</span>
              <span>Combine Trip Cluster</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Switcher Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8f3eb] border border-[#e8dfcf] p-3 rounded-2xl">
          {/* Switcher Tabs */}
          <div className="flex space-x-2 text-xs font-semibold">
            <button
              onClick={() => handleTabChange('groups')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                activeTab === 'groups'
                  ? 'bg-stone-800 text-[#fbf9f4] shadow-xs'
                  : 'bg-[#ede4d4] text-stone-700 hover:bg-[#e4d7c3]'
              }`}
            >
              <span>🎒</span>
              <span>All Daily Circles ({groups.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('clusters')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                activeTab === 'clusters'
                  ? 'bg-stone-800 text-[#fbf9f4] shadow-xs'
                  : 'bg-[#ede4d4] text-stone-700 hover:bg-[#e4d7c3]'
              }`}
            >
              <span>🧳</span>
              <span>All Trip Clusters ({clusters.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'groups' ? 'circles' : 'trip clusters'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#fbf9f4] border border-[#dcd1bf] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: All Daily Circles View */}
        {activeTab === 'groups' && (
          <section className="space-y-4">
            {loading ? (
              <div className="p-10 text-center bg-[#f7f2e9] rounded-xl border border-[#e8dfcf] text-stone-500 text-sm">
                ⏳ Loading all circles...
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-sm">
                {error}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-10 text-center bg-[#f7f2e9] rounded-2xl border border-[#e6ddd0] space-y-3">
                <span className="text-4xl block">🍃</span>
                <h3 className="font-serif-quote font-bold text-lg text-stone-800">
                  {searchTerm ? 'No circles matching your search' : 'No circles found'}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {searchTerm
                    ? `No groups match "${searchTerm}". Try a different term or clear the search.`
                    : 'Create your first group for a trip, flat rent, or outing to start splitting expenses.'}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-700 text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] text-xs font-medium px-4 py-2 rounded-lg transition"
                  >
                    Create First Group
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                  const emoji = getGroupEmoji(group.name, group.description);

                  return (
                    <Link
                      key={group._id}
                      to={`/group/${group._id}`}
                      className="group bg-[#f6efe4] hover:bg-[#f1e9dd] border border-[#e6dcce] hover:border-[#cfc1ad] rounded-xl p-4.5 transition duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl p-1.5 bg-[#ede4d4] rounded-lg shadow-3xs">
                              {emoji}
                            </span>
                            <h3 className="font-serif-quote font-bold text-base text-stone-900 group-hover:text-stone-700 transition">
                              {group.name}
                            </h3>
                          </div>
                          <span className="text-[11px] bg-[#eadecc] text-stone-700 px-2 py-0.5 rounded font-mono">
                            {group.members?.length || 1} {group.members?.length === 1 ? 'person' : 'people'}
                          </span>
                        </div>

                        <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                          {group.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#e8ded0] flex items-center justify-between text-[11px] text-stone-500">
                        <span className="flex items-center space-x-1">
                          <span>📅</span>
                          <span>{new Date(group.date || group.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className="font-semibold text-stone-800 group-hover:translate-x-0.5 transition-transform">
                          Open Ledger →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: All Trip Clusters View */}
        {activeTab === 'clusters' && (
          <section className="space-y-4">
            {loading ? (
              <div className="p-10 text-center bg-[#f7f2e9] rounded-xl border border-[#e8dfcf] text-stone-500 text-sm">
                ⏳ Loading all trip clusters...
              </div>
            ) : filteredClusters.length === 0 ? (
              <div className="p-10 text-center bg-[#f7f2e9] rounded-2xl border border-[#e6ddd0] space-y-3">
                <span className="text-4xl block">🗺️</span>
                <h3 className="font-serif-quote font-bold text-lg text-stone-800">
                  {searchTerm ? 'No trip clusters matching your search' : 'No Trip Clusters Yet'}
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {searchTerm
                    ? `No clusters match "${searchTerm}". Try a different term or clear the search.`
                    : 'If you created a group for each day of a trip, cluster them into one to view a single consolidated Final Debt Summary!'}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-700 text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreateClusterModal(true)}
                    disabled={groups.length === 0}
                    className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-[#fbf9f4] text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <span>🧳</span>
                    <span>Cluster Your Daily Groups</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClusters.map((cluster) => (
                  <Link
                    key={cluster._id}
                    to={`/cluster/${cluster._id}`}
                    className="group bg-[#f6efe4] hover:bg-[#f1e9dd] border border-[#e6dcce] hover:border-[#cfc1ad] rounded-xl p-4.5 transition duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2.5">
                          {cluster.image ? (
                            <img
                              src={cluster.image}
                              alt={cluster.name}
                              className="w-9 h-9 rounded-lg object-cover border border-[#d8cebd] shrink-0 shadow-3xs"
                            />
                          ) : (
                            <span className="text-xl p-1.5 bg-[#eae0cf] rounded-lg shadow-3xs shrink-0 flex items-center justify-center w-9 h-9">
                              🧳
                            </span>
                          )}
                          <h3 className="font-serif-quote font-bold text-base text-stone-900 group-hover:text-stone-700 transition">
                            {cluster.name}
                          </h3>
                        </div>
                        <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold border border-amber-200">
                          {cluster.groups?.length || 0} {cluster.groups?.length === 1 ? 'day' : 'days'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                        {cluster.description || 'Consolidated trip ledger across multiple days.'}
                      </p>

                      {/* Clustered days preview */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {cluster.groups?.map((grp) => (
                          <span
                            key={grp._id}
                            className="text-[10px] bg-[#ede3d1] text-stone-700 px-2 py-0.5 rounded border border-[#decfa8] truncate max-w-[140px]"
                          >
                            📍 {grp.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#e8ded0] flex items-center justify-between text-[11px] text-stone-500">
                      <span className="text-stone-500">
                        By {cluster.createdBy?.name || 'You'}
                      </span>
                      <span className="font-semibold text-stone-800 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                        <span>Final Debt Summary</span>
                        <span>→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#ece4d6]">
              <div className="flex items-center space-x-2">
                <span>✨</span>
                <h2 className="font-serif-quote font-bold text-lg text-stone-900">
                  Create a New Group
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Manali Backpackers, Flat 402"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fuel, cabin stay, and meals"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Event / Start Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
                />
              </div>

              {/* Suggestions from Previous Groups */}
              {recentMembers.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-medium text-stone-700 text-xs">
                      Add Members from Previous Groups
                    </label>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {selectedMemberIds.length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#f6efe4] rounded-lg border border-[#dcd1bf]">
                    {recentMembers.map((m) => {
                      const isSelected = selectedMemberIds.includes(m._id);
                      return (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMemberIds(selectedMemberIds.filter((id) => id !== m._id));
                            } else {
                              setSelectedMemberIds([...selectedMemberIds, m._id]);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-stone-800 text-[#fbf9f4] border-stone-800 font-semibold'
                              : 'bg-[#fbf9f4] hover:bg-[#ede5d6] text-stone-700 border-[#d8cebd]'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-stone-500">
                    💡 Selected friends will automatically be added as members upon creating this circle.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#ece4d6]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 border border-[#d8cdbc] text-stone-700 rounded-lg hover:bg-[#ede5d6] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] rounded-lg text-xs font-medium transition disabled:bg-stone-400"
                >
                  {createLoading ? 'Creating...' : 'Create Circle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Cluster Modal */}
      {showCreateClusterModal && (
        <CreateClusterModal
          groups={groups}
          onClose={() => setShowCreateClusterModal(false)}
          onClusterCreated={fetchDashboardData}
        />
      )}
    </div>
  );
}
