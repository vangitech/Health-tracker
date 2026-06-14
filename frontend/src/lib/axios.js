// frontend/src/lib/axios.js
import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { capacitorAdapter } from './capacitor-adapter'

// Set default API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://health-tracker-14dn.onrender.com'
axios.defaults.baseURL = API_URL

// Use native HTTP adapter when running inside Capacitor to bypass CORS
if (Capacitor.isNativePlatform()) {
  axios.defaults.adapter = capacitorAdapter
}

// Request interceptor - add token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config?.url?.includes('/api/auth/login')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Test connection on load
axios.get('/health').catch(() => {})

export default axios
