import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getMe } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const fetchUser = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await getMe();
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to restore session:', err);
          // Only discard token if the server explicitly rejected authentication (401/403)
          // Do not delete token if server is temporarily unreachable / starting up (e.g. ERR_CONNECTION_REFUSED / network error)
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }

    // Rotate quote and picture theme every time the user logs in
    const currentThemeIdx = parseInt(localStorage.getItem('quote_login_index') || '0', 10);
    const nextThemeIdx = (currentThemeIdx + 1) % 4;
    localStorage.setItem('quote_login_index', nextThemeIdx.toString());

    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    return res.data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
