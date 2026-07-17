import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const stored = localStorage.getItem('token');
    if (stored) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
    }
    (async () => {
      try {
        const res = await axios.get('/api/auth/me');
        if (!cancelled) setUser(res.data.user || res.data);
      } catch {
        if (stored) localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
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
    const { token, user } = response.data;
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setUser(user);
    return response.data;
  };

  const handleOAuthToken = async (oauthToken) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${oauthToken}`;
    localStorage.setItem('token', oauthToken);
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user || res.data);
    } catch {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, handleOAuthToken, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
