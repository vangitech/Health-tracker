import { createContext, useContext, useState, useEffect } from 'react';
import axiosLib from 'axios';

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/android/i.test(ua)) return 'http://10.0.2.2:5001';
  if (/iphone|ipad|ipod/i.test(ua)) return 'http://localhost:5001';
  return 'http://localhost:5001';
}

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
    const stored = localStorage.getItem('admin_token');
    if (stored) {
      adminAxios.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
    }
    (async () => {
      try {
        const { data } = await adminAxios.get('/profile');
        if (!cancelled) setAdmin(data);
      } catch {
        localStorage.removeItem('admin_token');
        delete adminAxios.defaults.headers.common['Authorization'];
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
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
      adminAxios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    setAdmin(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await adminAxios.post('/logout');
    } catch {}
    localStorage.removeItem('admin_token');
    delete adminAxios.defaults.headers.common['Authorization'];
    setAdmin(null);
  };

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
