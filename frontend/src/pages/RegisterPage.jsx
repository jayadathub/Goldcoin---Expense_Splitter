import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import goldcoinLogo from '../assets/goldcoin-logo.png';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await register(name, email, password);
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
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
            Join Goldcoin
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Start splitting expenses easily with your group
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#fbf9f4] border border-[#dcd1bf] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-600"
              required
            />
          </div>

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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs text-stone-600 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-stone-900 hover:underline font-bold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
