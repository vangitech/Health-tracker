import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axiosLib from 'axios'
import { useNavigate } from 'react-router-dom'

const adminAxios = axiosLib.create({
  baseURL: '/api/admin',
})

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('admin_token'))
  const [loading, setLoading] = useState(true)

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
