import { createContext, useContext, useState, useEffect } from 'react';
import axios, { setAuthToken, clearAuthToken } from '../lib/axios';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function getInactivityTimeout() {
  const env = import.meta.env.VITE_INACTIVITY_TIMEOUT;
  if (env) {
    const n = parseInt(env, 10);
    if (!Number.isNaN(n) && n > 0) return n * 1000;
  }
  return 30 * 60 * 1000;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await axios.get('/api/auth/me');
        if (!cancelled) setUser(res.data.user || res.data);
      } catch {
        /* cookie not yet set or expired */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { user, token } = response.data;
    if (token) setAuthToken(token);
    setUser(user);
    return response.data;
  };

  const handleOAuthToken = async () => {
    try {
      await axios.get('/api/auth/me');
    } catch {
      /* cookie flow handles auth */
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch {
      /* best-effort logout */
    }
    clearAuthToken();
    setUser(null);
  };

  const signedIn = !!user && !loading;
  useInactivityLogout(logout, getInactivityTimeout(), signedIn);

  return (
    <AuthContext.Provider value={{ user, loading, login, handleOAuthToken, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
