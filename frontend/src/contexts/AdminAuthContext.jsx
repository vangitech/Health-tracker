import { createContext, useContext, useState, useEffect } from 'react';
import axiosLib from 'axios';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { getApiUrl } from '../lib/axios';

const adminAxios = axiosLib.create({
  baseURL: `${getApiUrl()}/api/admin`,
  withCredentials: true,
});

adminAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      window.location.href = '/iaccess/login';
    }
    return Promise.reject(err);
  }
);

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await adminAxios.get('/profile');
        if (!cancelled) setAdmin(data);
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
    const { data } = await adminAxios.post('/login', { email, password });
    setAdmin(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await adminAxios.post('/logout');
    } catch {}
    setAdmin(null);
  };

  const signedIn = !!admin && !loading;
  useInactivityLogout(logout, 30 * 60 * 1000, signedIn);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, setAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

export { adminAxios };
