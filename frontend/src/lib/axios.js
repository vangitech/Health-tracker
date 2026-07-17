import axiosLib from 'axios';

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
