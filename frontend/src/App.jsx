import { Routes, Route, Navigate } from 'react-router-dom'
import { IonPage, IonContent } from '@ionic/react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import OAuthCallback from './pages/OAuthCallback'
import Dashboard from './pages/Dashboard'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-justify-content-center ion-align-items-center">
          <div className="flex flex-col items-center gap-3 h-full justify-center bg-black">
            <div className="size-7 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
          </div>
        </IonContent>
      </IonPage>
    )
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
