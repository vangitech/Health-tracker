// frontend/src/lib/axios.js
import axios from 'axios'

// Determine API URL:
// 1. VITE_API_URL env var (set during build for production/native)
// 2. Android emulator uses 10.0.2.2 to reach host localhost
// 3. iOS simulator / web dev uses localhost
function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  // @ts-ignore
  if (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
    return 'http://10.0.2.2:5001'
  }
  return 'http://localhost:5001'
}

const API_URL = getApiUrl()
axios.defaults.baseURL = API_URL

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
      // Clear token on unauthorized
      localStorage.removeItem('token')
      window.location.href = '/login'
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
