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

// Log initial configuration
console.log('🔧 Axios configured with API URL:', API_URL)

// Request interceptor - add token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('📤 Sending request with token')
    }
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status)
    return response
  },
  (error) => {
    // Log detailed error information
    console.error('❌ Response error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method,
      fullError: error.message
    })

    // Handle different error types
    if (error.response?.status === 401) {
      // Don't redirect on login requests — let the component handle it
      if (!error.config?.url?.includes('/api/auth/login')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      console.error('🚫 Forbidden - Check CORS configuration or permissions')
    } else if (error.message === 'Network Error' || !error.response) {
      console.error('🌐 Network Error - Backend server may not be running')
      console.error('   Expected API URL:', API_URL)
    }

    return Promise.reject(error)
  }
)

// Test connection on load
axios.get('/health').catch(() => {
  console.warn('⚠️ Warning: Cannot reach API at', API_URL)
})

export default axios
