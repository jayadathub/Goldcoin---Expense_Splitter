import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { updateProfile } from '../services/api.js';
import goldcoinLogo from '../assets/goldcoin-logo.png';

export default function Navbar({ onOpenCreateGroup }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (!newName.trim()) {
      setStatusMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    try {
      setSaveLoading(true);
      const res = await updateProfile({
        name: newName.trim(),
        password: newPassword.trim() || undefined,
      });

      updateUser(res.data.user);
      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setNewPassword('');
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      {/* Top Floating Bar */}
      <header className="sticky top-0 z-40 bg-[#fbf9f4]/90 backdrop-blur-md border-b border-[#e7e0d3] px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo / Brand */}
          <Link
            to="/"
            className="flex items-center space-x-3 text-stone-800 hover:text-stone-900 group"
          >
            <img
              src={goldcoinLogo}
              alt="Goldcoin logo"
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-serif-quote font-bold text-2xl tracking-tight text-stone-900 leading-none">
                Goldcoin
              </span>
              <span className="text-[10px] tracking-widest uppercase text-stone-600 font-semibold mt-0.5">
                Split Ease & Harmony
              </span>
            </div>
          </Link>

          {/* Top Right Action Button */}
          {user ? (
            <button
              onClick={() => {
                setIsOpen(true);
                setNewName(user.name);
                setStatusMsg({ type: '', text: '' });
              }}
              className="flex items-center space-x-2 bg-[#f2ecdf] hover:bg-[#eae2d3] border border-[#dcd2c1] text-stone-800 px-3.5 py-1.5 rounded-full shadow-xs transition hover:shadow-sm"
              title="Open Menu & Account Settings"
            >
              <div className="w-7 h-7 rounded-full bg-stone-700 text-[#fbf9f4] flex items-center justify-center font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold hidden sm:inline text-stone-700">
                {user.name}
              </span>
              <span className="text-stone-600 text-sm">☰</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 text-sm">
              <Link
                to="/login"
                className="text-stone-700 hover:text-stone-900 font-medium px-3 py-1.5 rounded-lg hover:bg-[#ede5d6] transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] font-medium px-4 py-1.5 rounded-lg shadow-xs transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Right-Side Slide-Over Menu & Account Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-sm bg-[#fbf9f4] border-l border-[#e4dcce] shadow-2xl h-full flex flex-col p-6 z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#e8e0d2]">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🌿</span>
                <h2 className="font-serif-quote font-bold text-lg text-stone-900">
                  Account & Menu
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone-500 hover:text-stone-800 p-1 rounded-md text-lg hover:bg-[#eee6d7] transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Profile Card Section */}
            <div className="mt-5 p-4 bg-[#f4eee2] rounded-xl border border-[#ded5c4] shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-stone-800 text-[#fbf9f4] flex items-center justify-center font-bold text-lg shadow-sm">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 text-sm truncate">{user?.name}</h3>
                  <p className="text-xs text-stone-600 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-[#e6ddcd] text-stone-700 px-2 py-0.5 rounded-full font-medium">
                    Verified Member
                  </span>
                </div>
              </div>

              {/* Edit Profile Toggle Button */}
              <div className="mt-4 pt-3 border-t border-[#dfd5c4] flex justify-between items-center">
                <span className="text-xs text-stone-600 font-medium">Personal Details</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs bg-[#eadecb] hover:bg-[#e0d3bf] text-stone-800 font-semibold px-2.5 py-1 rounded transition"
                >
                  {isEditing ? 'Cancel' : '✏️ Edit Profile'}
                </button>
              </div>

              {/* Status Alert */}
              {statusMsg.text && (
                <div
                  className={`mt-3 p-2 rounded text-xs ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              {/* Edit Profile Inline Form */}
              {isEditing && (
                <form onSubmit={handleUpdateProfile} className="mt-3 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Display Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-[#fbf9f4] border border-[#d8cdbc] rounded px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-stone-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep same"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#fbf9f4] border border-[#d8cdbc] rounded px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-stone-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="w-full bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] font-medium py-1.5 rounded transition disabled:bg-stone-400"
                  >
                    {saveLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              )}
            </div>

            {/* Navigation Shortcuts */}
            <div className="mt-6 flex-1 space-y-2">
              <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase px-1">
                Navigation
              </span>

              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-stone-800 hover:bg-[#f1eae0] font-medium transition"
              >
                <span className="text-base">🏡</span>
                <span>Home</span>
              </Link>

              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-stone-800 hover:bg-[#f1eae0] font-medium transition"
              >
                <span className="text-base">📚</span>
                <span>All Circles & Clusters</span>
              </Link>

              {onOpenCreateGroup && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCreateGroup();
                  }}
                  className="w-full text-left flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-stone-800 hover:bg-[#f1eae0] font-medium transition"
                >
                  <span className="text-base">✨</span>
                  <span>Create New Group</span>
                </button>
              )}
            </div>

            {/* Logout Footer */}
            <div className="pt-4 border-t border-[#e8e0d2]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 bg-[#f0e7d8] hover:bg-[#e4d8c6] text-stone-800 font-medium py-2 rounded-lg text-xs transition border border-[#dcd1be]"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
              <div className="flex items-center justify-center space-x-2 mt-2.5">
                <img
                  src={goldcoinLogo}
                  alt="Goldcoin"
                  className="w-5 h-5 object-contain drop-shadow-xs"
                />
                <p className="text-[10px] text-stone-600 font-medium">
                  Goldcoin • Warm & Seamless
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
