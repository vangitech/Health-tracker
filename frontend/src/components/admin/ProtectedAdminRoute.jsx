import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="size-6 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/iaccess" replace />
  }

  return children
}
