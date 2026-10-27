import { useState } from 'react';
import { updateGroup, deleteGroup } from '../services/api.js';

export default function EditGroupModal({ group, onClose, onGroupUpdated, onGroupDeleted }) {
  const [name, setName] = useState(group.name || '');
  const [description, setDescription] = useState(group.description || '');
  const [date, setDate] = useState(
    group.date
      ? new Date(group.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      await updateGroup(group._id, {
        name: name.trim(),
        description: description.trim(),
        date,
      });
      if (onGroupUpdated) onGroupUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update group details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${group.name}"?\n\nAll recorded expenses, splits, and settlements in this group will be deleted. This cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setDeleteLoading(true);
      setError('');
      await deleteGroup(group._id);
      if (onGroupDeleted) {
        onGroupDeleted();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group. Details: ${err.response?.data?.message || err.message}');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#ece4d6]">
          <div className="flex items-center space-x-2">
            <span>✏️</span>
            <h2 className="font-serif-quote font-bold text-lg text-stone-900">
              Edit Group Details
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
            <label className="block font-medium text-stone-700 mb-1">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip 2026"
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">
              Description (optional)
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Shared expenses for hotel, travel, and food"
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
            />
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">
              Date (optional)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#f6efe4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#ece4d6]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading || loading}
              className="text-rose-700 hover:text-rose-800 text-xs font-semibold px-2 py-1.5 rounded-lg transition underline disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Group'}
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-[#d8cdbc] text-stone-700 rounded-lg hover:bg-[#ede5d6] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleteLoading}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] rounded-lg text-xs font-medium transition disabled:bg-stone-400"
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
