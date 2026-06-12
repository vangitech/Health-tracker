import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthToken } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      handleOAuthToken(token)
      navigate('/', { replace: true })
    } else {
      setError('No authentication token received.')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-black flex items-center justify-center">
      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <Loader2 className="size-8 text-white/60 animate-spin" />
      )}
    </div>
  )
}
