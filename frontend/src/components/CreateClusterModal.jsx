import { useState } from 'react';
import { createCluster } from '../services/api.js';
import ClusterImagePicker from './ClusterImagePicker.jsx';

export default function CreateClusterModal({ groups = [], onClose, onClusterCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map((g) => g._id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this trip cluster.');
      return;
    }
    if (selectedGroupIds.length === 0) {
      setError('Please select at least one daily circle to include in this trip cluster.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await createCluster({
        name: name.trim(),
        description: description.trim(),
        groups: selectedGroupIds,
        image: image || '',
      });
      onClusterCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip cluster.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#ece4d6]">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🧳</span>
            <div>
              <h2 className="font-serif-quote font-bold text-lg text-stone-900">
                Cluster Trip Groups
              </h2>
              <p className="text-[11px] text-stone-500">
                Combine daily circles from a trip to generate a single consolidated Final Debt Summary.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col min-h-0 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-stone-700 mb-1">
              Trip Cluster Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Trip 2026 (All Days)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#f6efe4] border border-[#d8cebd] focus:border-stone-800 focus:outline-none rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Trip Note / Description</label>
            <input
              type="text"
              placeholder="e.g. Combined ledger for Day 1 arrival, Day 2 beach, Day 3 trek..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f6efe4] border border-[#d8cebd] focus:border-stone-800 focus:outline-none rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm"
            />
          </div>

          {/* Cluster Icon / Picture Picker */}
          <ClusterImagePicker image={image} onChange={setImage} />

          {/* Group Multi-select Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-stone-700">
                Select Daily Circles to Cluster ({selectedGroupIds.length}/{groups.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline"
              >
                {selectedGroupIds.length === groups.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 bg-[#f6efe4] rounded-xl border border-[#ded4c3]">
                No existing groups available. Create individual daily groups first before clustering.
              </p>
            ) : (
              <div className="overflow-y-auto space-y-2 max-h-56 p-1 pr-2 custom-scrollbar">
                {groups.map((grp) => {
                  const isChecked = selectedGroupIds.includes(grp._id);
                  return (
                    <label
                      key={grp._id}
                      onClick={() => toggleGroupSelection(grp._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-[#ede3d1] border-stone-800 ring-1 ring-stone-700'
                          : 'bg-[#f7f2e9] border-[#e2d8c8] hover:bg-[#efe7d8]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent label
                          className="rounded text-stone-800 focus:ring-stone-600 h-4 w-4 accent-stone-800"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 text-xs truncate">
                            {grp.name}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            📅 {new Date(grp.date || grp.createdAt).toLocaleDateString()} • {grp.members?.length || 1} members
                          </p>
                        </div>
                      </div>

                      {isChecked && (
                        <span className="text-[10px] font-bold bg-stone-800 text-[#fbf9f4] px-1.5 py-0.5 rounded">
                          Added
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-[#ece4d6]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-700 font-semibold px-4 py-2 rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedGroupIds.length === 0}
              className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-[#fbf9f4] font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5"
            >
              <span>{loading ? 'Clustering...' : '🧳 Create Trip Cluster'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
