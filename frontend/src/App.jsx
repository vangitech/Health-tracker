// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import OAuthCallback from './pages/OAuthCallback'
import Dashboard from './pages/Dashboard'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-dvh bg-black"><div className="size-6 rounded-full border-2 border-zinc-700 border-t-white animate-spin" /></div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return children
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App