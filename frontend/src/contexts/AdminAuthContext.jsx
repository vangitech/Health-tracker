import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axiosLib from 'axios'

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/android/i.test(ua)) return 'http://10.0.2.2:5001'
  if (/iphone|ipad|ipod/i.test(ua)) return 'http://localhost:5001'
  return 'http://localhost:5001'
}

const adminAxios = axiosLib.create({
  baseURL: `${getApiUrl()}/api/admin`,
})

function adminTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

adminAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('admin_token')
      window.location.href = '/iaccess/login'
    }
    return Promise.reject(err)
  }
)

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    if (!stored || adminTokenExpired(stored)) {
      if (stored) localStorage.removeItem('admin_token')
      setLoading(false)
      return
    }
    setToken(stored)
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      adminAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const { data } = await adminAxios.get('/profile')
      setAdmin(data)
    } catch {
      localStorage.removeItem('admin_token')
      delete adminAxios.defaults.headers.common['Authorization']
      setToken(null)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const login = async (email, password) => {
    const { data } = await adminAxios.post('/login', { email, password })
    localStorage.setItem('admin_token', data.token)
    adminAxios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setAdmin(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    delete adminAxios.defaults.headers.common['Authorization']
    setToken(null)
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout, setAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}

export { adminAxios }
