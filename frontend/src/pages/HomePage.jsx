import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import CreateClusterModal from '../components/CreateClusterModal.jsx';
import { getMyGroups, createGroup, getRecentMembers, getMyClusters } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getActiveTheme, rotateToNextTheme } from '../utils/quotes.js';

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

export default function HomePage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab for the left panel: 'groups' | 'clusters'
  const [leftTab, setLeftTab] = useState('groups');

  // Dynamic rotating quote & picture theme (changes on each login)
  const [theme, setTheme] = useState(getActiveTheme());

  useEffect(() => {
    const handleQuoteUpdated = () => setTheme(getActiveTheme());
    window.addEventListener('quote-updated', handleQuoteUpdated);
    return () => window.removeEventListener('quote-updated', handleQuoteUpdated);
  }, []);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateClusterModal, setShowCreateClusterModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchHomeData = async () => {
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
      setError('Failed to fetch your data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

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
      fetchHomeData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  // Up to 3 latest groups and 3 latest clusters
  const latestGroups = groups.slice(0, 3);
  const latestClusters = clusters.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-800 flex flex-col selection:bg-[#e7dcce]">
      <Navbar onOpenCreateGroup={() => setShowCreateModal(true)} />

      <main className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 space-y-6">
        {/* Main 2-Column Split: 3 Components on Left, Rest on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: 3 Components covering the left empty area    */}
          {/* ======================================================== */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-[#f5efe4] border border-[#e5dccf] rounded-2xl p-4.5 sm:p-5 shadow-xs space-y-4">
              {/* Header with Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-[#e6dcce] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌿</span>
                  <h2 className="font-serif-quote font-bold text-base sm:text-lg text-stone-900">
                    Latest Activity
                  </h2>
                </div>

                <div className="flex items-center space-x-1 bg-[#ede4d4] p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setLeftTab('groups')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      leftTab === 'groups'
                        ? 'bg-stone-800 text-[#fbf9f4] shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    Circles ({latestGroups.length})
                  </button>
                  <button
                    onClick={() => setLeftTab('clusters')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      leftTab === 'clusters'
                        ? 'bg-stone-800 text-[#fbf9f4] shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    Trips ({latestClusters.length})
                  </button>
                </div>
              </div>

              {/* Subtitle & Quick Action */}
              <div className="flex items-center justify-between text-xs text-stone-500 px-0.5">
                <span>
                  Showing {leftTab === 'groups' ? latestGroups.length : latestClusters.length} of{' '}
                  {leftTab === 'groups' ? groups.length : clusters.length} latest
                </span>
                {leftTab === 'groups' ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="font-semibold text-stone-800 hover:text-stone-950 underline"
                  >
                    + New Group
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreateClusterModal(true)}
                    className="font-semibold text-stone-800 hover:text-stone-950 underline"
                  >
                    + Cluster Trips
                  </button>
                )}
              </div>

              {/* The 3 Components List */}
              {loading ? (
                <div className="p-8 text-center bg-[#fbf9f4] rounded-xl border border-[#e8dfcf] text-stone-500 text-xs">
                  ⏳ Loading latest...
                </div>
              ) : leftTab === 'groups' ? (
                /* 3 Latest Circles */
                groups.length === 0 ? (
                  <div className="p-6 text-center bg-[#fbf9f4] rounded-xl border border-[#e8dfcf] space-y-2">
                    <span className="text-2xl block">🍃</span>
                    <p className="text-xs font-semibold text-stone-700">No circles created yet</p>
                    <p className="text-[11px] text-stone-500">
                      Start your first circle for outings or flat expenses.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] text-xs font-medium px-3.5 py-1.5 rounded-lg transition"
                    >
                      Create Circle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {latestGroups.map((group) => {
                      const emoji = getGroupEmoji(group.name, group.description);
                      return (
                        <Link
                          key={group._id}
                          to={`/group/${group._id}`}
                          className="group block bg-[#fbf9f4] hover:bg-[#f2eadc] border border-[#e2d8c8] hover:border-[#cfc1ad] rounded-xl p-3.5 transition duration-200 shadow-3xs hover:shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="text-lg p-1 bg-[#ede4d4] rounded-lg shadow-3xs shrink-0">
                                {emoji}
                              </span>
                              <h3 className="font-serif-quote font-bold text-sm text-stone-900 group-hover:text-stone-700 transition truncate">
                                {group.name}
                              </h3>
                            </div>
                            <span className="text-[10px] bg-[#eadecc] text-stone-700 px-2 py-0.5 rounded font-mono shrink-0">
                              {group.members?.length || 1}{' '}
                              {group.members?.length === 1 ? 'person' : 'people'}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-600 line-clamp-1 mt-1.5">
                            {group.description || 'Shared expense circle.'}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-[#eee5d8] flex items-center justify-between text-[10px] text-stone-500">
                            <span>📅 {new Date(group.date || group.createdAt).toLocaleDateString()}</span>
                            <span className="font-semibold text-stone-800 group-hover:translate-x-0.5 transition-transform">
                              Open Ledger →
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )
              ) : (
                /* 3 Latest Trip Clusters */
                clusters.length === 0 ? (
                  <div className="p-6 text-center bg-[#fbf9f4] rounded-xl border border-[#e8dfcf] space-y-2">
                    <span className="text-2xl block">🗺️</span>
                    <p className="text-xs font-semibold text-stone-700">No trip clusters yet</p>
                    <p className="text-[11px] text-stone-500">
                      Combine daily groups into one trip cluster for consolidated settlements.
                    </p>
                    <button
                      onClick={() => setShowCreateClusterModal(true)}
                      disabled={groups.length === 0}
                      className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-[#fbf9f4] text-xs font-medium px-3.5 py-1.5 rounded-lg transition"
                    >
                      Cluster Daily Groups
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {latestClusters.map((cluster) => (
                      <Link
                        key={cluster._id}
                        to={`/cluster/${cluster._id}`}
                        className="group block bg-[#fbf9f4] hover:bg-[#f2eadc] border border-[#e2d8c8] hover:border-[#cfc1ad] rounded-xl p-3.5 transition duration-200 shadow-3xs hover:shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {cluster.image ? (
                              <img
                                src={cluster.image}
                                alt={cluster.name}
                                className="w-8 h-8 rounded-lg object-cover border border-[#d8cebd] shrink-0 shadow-3xs"
                              />
                            ) : (
                              <span className="text-lg p-1 bg-[#eae0cf] rounded-lg shadow-3xs shrink-0 flex items-center justify-center w-8 h-8">
                                🧳
                              </span>
                            )}
                            <h3 className="font-serif-quote font-bold text-sm text-stone-900 group-hover:text-stone-700 transition truncate">
                              {cluster.name}
                            </h3>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold border border-amber-200 shrink-0">
                            {cluster.groups?.length || 0}{' '}
                            {cluster.groups?.length === 1 ? 'day' : 'days'}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-600 line-clamp-1 mt-1.5">
                          {cluster.description || 'Consolidated multi-day trip ledger.'}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {cluster.groups?.slice(0, 2).map((grp) => (
                            <span
                              key={grp._id}
                              className="text-[9px] bg-[#ede3d1] text-stone-700 px-1.5 py-0.5 rounded border border-[#decfa8] truncate max-w-[110px]"
                            >
                              📍 {grp.name}
                            </span>
                          ))}
                          {cluster.groups?.length > 2 && (
                            <span className="text-[9px] text-stone-500 font-medium self-center">
                              +{cluster.groups.length - 2} more
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#eee5d8] flex items-center justify-between text-[10px] text-stone-500">
                          <span>By {cluster.createdBy?.name || 'You'}</span>
                          <span className="font-semibold text-stone-800 group-hover:translate-x-0.5 transition-transform">
                            Final Debt Summary →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              )}

              {/* View All In Dashboard Footer Link */}
              <div className="pt-2 border-t border-[#e6dcce]">
                <Link
                  to={leftTab === 'groups' ? '/dashboard?tab=groups' : '/dashboard?tab=clusters'}
                  className="w-full text-center block py-2 px-3 rounded-xl bg-[#ede3d1] hover:bg-[#e4d7c3] text-stone-800 text-xs font-semibold transition border border-[#d8cbba]"
                >
                  View All in Dashboard ({leftTab === 'groups' ? groups.length : clusters.length}) →
                </Link>
              </div>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: The Rest of Webpage Filling Right Empty Area */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Top: Artistic Quote & Minimalist Hero Picture Banner */}
            <section className="bg-[#f5efe4] border border-[#e5dccf] rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
              {/* Subtle decorative background watermarks */}
              <div className="absolute -top-12 -right-12 text-[#eee3d1] text-9xl font-serif pointer-events-none select-none opacity-40">
                “
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
                {/* Quote & Philosophy text */}
                <div className="md:col-span-7 space-y-3.5">
                  <div className="flex items-center space-x-2">
                    <div className="inline-flex items-center space-x-2 bg-[#eae1d0] text-stone-700 px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                      <span>{theme.tagEmoji}</span>
                      <span>{theme.tagPill}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTheme(rotateToNextTheme())}
                      title="Cycle to next aesthetic quote & picture"
                      className="text-[11px] bg-[#ebe1d0]/80 hover:bg-[#e0d4c0] text-stone-600 px-2.5 py-1 rounded-full font-medium transition flex items-center space-x-1"
                    >
                      <span>🎲</span>
                      <span>New Inspiration</span>
                    </button>
                  </div>

                  <blockquote className="space-y-2">
                    <p className="font-serif-quote italic text-2xl sm:text-3xl text-stone-900 leading-snug tracking-tight">
                      {theme.quote}
                    </p>
                    <footer className="text-xs text-stone-500 font-medium tracking-wider uppercase">
                      {theme.author}
                    </footer>
                  </blockquote>

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                    {theme.description}
                  </p>


                  <div className="flex items-center space-x-2 text-xs text-stone-600 pt-1">
                    <span className="bg-[#ebd9c1] text-stone-800 px-2.5 py-1 rounded-md font-semibold">
                      {groups.length} {groups.length === 1 ? 'active group' : 'active groups'}
                    </span>
                    <span>•</span>
                    <span className="bg-[#e4dccb] text-stone-800 px-2.5 py-1 rounded-md font-semibold">
                      {clusters.length} {clusters.length === 1 ? 'trip cluster' : 'trip clusters'}
                    </span>
                  </div>
                </div>

                {/* Aesthetic Picture Banner */}
                <div className="md:col-span-5 flex justify-center">
                  <div className="relative rounded-xl overflow-hidden border border-[#ded3c2] shadow-sm bg-[#ede5d6] p-1.5 w-full max-w-md">
                    <img
                      src={theme.image}
                      alt={theme.vibeLabel}
                      className="w-full h-48 sm:h-56 object-cover rounded-lg filter saturate-90 brightness-98 hover:scale-102 transition duration-500"
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-[#fbf9f4]/85 backdrop-blur-xs px-3 py-1.5 rounded-md border border-[#e8dfcf] flex items-center justify-between text-[11px] text-stone-700 font-medium">
                      <span>{theme.locationLabel}</span>
                      <span className="text-stone-500">{theme.vibeLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* Bottom Directory Access Banner */}
            <div className="p-4 bg-[#f3ece0] border border-[#ded3c2] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-3xs">
              <div className="flex items-center space-x-3">
                <span className="text-2xl p-2 bg-[#eae0cf] rounded-xl">📚</span>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">
                    Complete Circles & Clusters Dashboard
                  </p>
                  <p className="text-stone-500 text-[11px]">
                    Browse and search your full catalog of {groups.length} circles and {clusters.length} trip clusters.
                  </p>
                </div>
              </div>
              <Link
                to="/dashboard"
                className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] font-semibold px-4 py-2 rounded-xl transition shadow-xs self-start sm:self-auto flex items-center space-x-1.5 shrink-0"
              >
                <span>Open Full Dashboard</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
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
          onClusterCreated={fetchHomeData}
        />
      )}
    </div>
  );
}
