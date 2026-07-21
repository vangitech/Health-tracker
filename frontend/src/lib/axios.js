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

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
    return 'http://10.0.2.2:5001';
  }
  return 'http://localhost:5001';
}

const API_URL = getApiUrl();
axiosLib.defaults.baseURL = API_URL;
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
