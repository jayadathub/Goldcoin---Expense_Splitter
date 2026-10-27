import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import goldcoinLogo from '../assets/goldcoin-logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-800 flex flex-col justify-center items-center p-4 selection:bg-[#e7dcce]">
      <div className="bg-[#f5efe4] border border-[#e5dccf] rounded-2xl shadow-xs p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src={goldcoinLogo}
            alt="Goldcoin"
            className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-md"
          />
          <h1 className="font-serif-quote font-bold text-2xl sm:text-3xl text-stone-900">
            Goldcoin
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Log in to manage and split your shared expenses & trips
          </p>
        </div>

        {successMessage && !error && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#fbf9f4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#fbf9f4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] font-medium py-2.5 rounded-xl shadow-xs transition disabled:bg-stone-400"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-stone-600 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-stone-900 hover:underline font-bold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
