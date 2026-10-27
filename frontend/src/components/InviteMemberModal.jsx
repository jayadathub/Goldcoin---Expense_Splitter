import { useState, useEffect } from 'react';
import { inviteMember, getRecentMembers } from '../services/api.js';

export default function InviteMemberModal({ groupId, existingMembers = [], onClose, onMemberAdded }) {
  const [email, setEmail] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch previous members as suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await getRecentMembers();
        const existingIds = new Set(existingMembers.map((m) => m._id?.toString()));
        // Filter out members already in this group
        const filtered = (res.data || []).filter((m) => !existingIds.has(m._id?.toString()));
        setSuggestions(filtered);
      } catch (err) {
        console.error('Failed to load member suggestions:', err);
      }
    };

    fetchSuggestions();
  }, [existingMembers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    try {
      setLoading(true);
      await inviteMember(groupId, { email: email.trim().toLowerCase() });
      onMemberAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  const matchingSuggestions = email.trim()
    ? suggestions.filter(
        (m) =>
          m.name.toLowerCase().includes(email.toLowerCase()) ||
          m.email.toLowerCase().includes(email.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#ece4d6]">
          <div className="flex items-center space-x-2">
            <span>✉️</span>
            <h2 className="font-serif-quote font-bold text-lg text-stone-900">
              Invite Member by Email
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
          <div className="relative">
            <label className="block font-medium text-stone-700 mb-1">
              Member Email Address
            </label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
              required
            />

            {/* Typeahead autocomplete dropdown */}
            {matchingSuggestions.length > 0 && email.trim() !== matchingSuggestions[0]?.email && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#fbf9f4] border border-[#d8cdbc] rounded-xl shadow-lg z-20 max-h-36 overflow-y-auto p-1 space-y-1">
                {matchingSuggestions.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setEmail(m.email)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#eee4d4] flex items-center justify-between transition text-xs"
                  >
                    <span className="font-semibold text-stone-800">{m.name}</span>
                    <span className="text-[11px] text-stone-500 font-mono">{m.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Clickable Suggestions Pills */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-stone-600 flex items-center space-x-1">
                <span>💡</span>
                <span>Previously added friends:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {suggestions.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setEmail(m.email)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition flex items-center space-x-1.5 ${
                      email.toLowerCase() === m.email.toLowerCase()
                        ? 'bg-stone-800 text-[#fbf9f4] border-stone-800'
                        : 'bg-[#ede5d6] hover:bg-[#e4dbca] text-stone-800 border-[#d8cebd]'
                    }`}
                  >
                    <span>👤</span>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-[9px] text-stone-500">({m.email})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-stone-500">
            💡 The member must already have an account registered with this email.
          </p>

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
              disabled={loading}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] rounded-lg text-xs font-medium transition disabled:bg-stone-400"
            >
              {loading ? 'Adding...' : 'Add to Circle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
