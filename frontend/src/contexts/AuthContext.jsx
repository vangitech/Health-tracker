import { createContext, useContext, useState, useEffect } from 'react'
import axios, { isTokenExpired } from '../lib/axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored || isTokenExpired(stored)) {
      if (stored) localStorage.removeItem('token')
      setLoading(false)
      return
    }
    setToken(stored)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!token) return
    setLoading(true)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    (async () => {
      try {
        const res = await axios.get('/api/auth/me')
        if (!cancelled) setUser(res.data.user || res.data)
      } catch {
        localStorage.removeItem('token')
        setToken(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setToken(token)
    setUser(user)
    return response.data
  }

  const handleOAuthToken = async (oauthToken) => {
    if (isTokenExpired(oauthToken)) {
      localStorage.removeItem('token')
      return
    }
    localStorage.setItem('token', oauthToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${oauthToken}`
    setToken(oauthToken);
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data.user || res.data)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, handleOAuthToken, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
