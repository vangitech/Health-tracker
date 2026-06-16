import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from '../lib/axios'
import { motion } from 'framer-motion'
import { Sparkles, User, Mail, Phone, Calendar, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import Footer from '../components/Footer'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (Object.values(formData).some(v => !v)) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/register', formData)
      sessionStorage.setItem('verifyEmail', formData.email)
      navigate('/verify', { state: { email: formData.email } })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'firstName', label: 'First Name', icon: User, type: 'text', placeholder: 'John', half: true },
    { name: 'lastName', label: 'Last Name', icon: User, type: 'text', placeholder: 'Doe', half: true },
    { name: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'john@example.com' },
    { name: 'phone', label: 'Phone', icon: Phone, type: 'tel', placeholder: '+1 (555) 123-4567' },
    { name: 'dob', label: 'Date of Birth', icon: Calendar, type: 'date', placeholder: '' },
  ]

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black select-none pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/2 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-end sm:justify-center items-center min-h-dvh p-0 sm:p-4 relative z-10"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl px-6 pt-8 pb-10"
          style={{
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <motion.div variants={itemVariants} className="text-center mb-6">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Sparkles className="size-7 text-white/80" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              Start tracking your blood sugar
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4"
            >
              {error}
            </motion.div>
          )}

          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {fields.slice(0, 2).map((field) => (
                <div key={field.name} className="relative">
                  <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required
                    placeholder={field.placeholder}
                    className="w-full h-12 pl-10 pr-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-colors"
                  />
                </div>
              ))}
            </div>

            {fields.slice(2).map((field) => (
              <div key={field.name} className="relative">
                <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  placeholder={field.placeholder}
                  className="w-full h-12 pl-10 pr-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-colors"
                />
              </div>
            ))}

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Password (min. 6 characters)"
                className="w-full h-12 pl-10 pr-11 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-12 bg-white text-black font-medium rounded-xl text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 mt-2"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin mx-auto" />
              ) : (
                'Create Account'
              )}
            </button>
          </motion.form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{' '}
              <Link to="/login" className="text-zinc-300 font-medium hover:text-white transition-colors">
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
      <Footer />
    </div>
  )
}
