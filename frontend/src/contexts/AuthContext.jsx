import { createContext, useContext, useState, useEffect } from 'react'
import axios from '../lib/axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    let cancelled = false
    if (!token) return
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    (async () => {
      try {
        const res = await axios.get('/api/auth/me')
        if (!cancelled) setUser(res.data.user || res.data)
      } catch {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            if (!cancelled) setUser({ id: payload.id, email: payload.email, firstName: payload.firstName, lastName: payload.lastName })
          } catch {
            localStorage.removeItem('token')
            setToken(null)
          }
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

  const handleOAuthToken = (oauthToken) => {
    localStorage.setItem('token', oauthToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${oauthToken}`
    setToken(oauthToken);
    // Fetch profile after setting token
    (async () => {
      try {
        const res = await axios.get('/api/auth/me')
        setUser(res.data.user || res.data)
      } catch {
          try {
            const payload = JSON.parse(atob(oauthToken.split('.')[1]))
            setUser({ id: payload.id, email: payload.email, firstName: payload.firstName, lastName: payload.lastName })
          } catch {
            console.error('Failed to decode token')
          }
      }
    })();
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
