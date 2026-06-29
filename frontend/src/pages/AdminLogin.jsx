import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Loader2, Activity, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    import('@capacitor/core')
      .then(({ Capacitor }) => { if (Capacitor.isNativePlatform()) navigate('/', { replace: true }) })
      .catch(() => {})
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/iaccess/dashboard')
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Check your connection.')
      } else {
        setError(err.response?.data?.message || 'Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-600 to-teal-800 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-8 ring-1 ring-white/20">
            <Activity className="size-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">SugarCare</h1>
          <p className="text-xl text-emerald-100/80 mb-6">Admin Dashboard</p>
          <p className="text-emerald-100/60 max-w-md mx-auto leading-relaxed">
            Monitor patient health metrics, manage appointments, and collaborate with your healthcare team in real time.
          </p>
          <div className="mt-10 flex items-center justify-center gap-2 text-emerald-200/50 text-sm">
            <Shield className="size-4" />
            Secure admin access only
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-emerald-100 mb-4">
              <Activity className="size-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900">SugarCare</h1>
            <p className="text-sm text-zinc-500 mt-1">Admin Dashboard</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-900">Welcome back</h2>
            <p className="text-sm text-zinc-500 mt-1">Sign in to your admin account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="Email address"
                className="w-full h-12 pl-10 pr-4 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full h-12 pl-10 pr-11 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl">
              {loading ? <Loader2 className="size-5 animate-spin mx-auto" /> : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-400">
            Authorized personnel only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  )
}
