import axiosLib from 'axios';

const TOKEN_KEY = 'auth_token';

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const isCapacitorNative =
    typeof window !== 'undefined' && typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
  if (isCapacitorNative) {
    const platform = window.Capacitor.getPlatform();
    if (platform === 'android') return 'http://10.0.2.2:5001';
    return 'http://localhost:5001';
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/android/i.test(ua)) return 'http://10.0.2.2:5001';
  if (/iphone|ipad|ipod/i.test(ua)) return 'http://localhost:5001';
  return 'http://localhost:5001';
}

axiosLib.defaults.baseURL = getApiUrl();
axiosLib.defaults.withCredentials = true;

axiosLib.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosLib.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosLib;
