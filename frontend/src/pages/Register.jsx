import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from '../lib/axios'
import { IonPage, IonContent, IonInput, IonButton, IonIcon } from '@ionic/react'
import { Capacitor } from '@capacitor/core'
import { motion } from 'framer-motion'
import WebFooter from '../components/WebFooter'
import { sparkles, personOutline, mailOutline, callOutline, calendarOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons'

const isNative = Capacitor.isNativePlatform()

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

const fields = [
  { name: 'firstName', label: 'First Name', icon: personOutline, type: 'text', placeholder: 'John', half: true },
  { name: 'lastName', label: 'Last Name', icon: personOutline, type: 'text', placeholder: 'Doe', half: true },
  { name: 'email', label: 'Email', icon: mailOutline, type: 'email', placeholder: 'john@example.com' },
  { name: 'phone', label: 'Phone', icon: callOutline, type: 'tel', placeholder: '+1 (555) 123-4567' },
  { name: 'dob', label: 'Date of Birth', icon: calendarOutline, type: 'date', placeholder: '' },
]

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

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
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

  return (
    <IonPage>
      <IonContent scrollY={true} className="ion-no-padding">
        <div className="relative min-h-full bg-black select-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col justify-end sm:justify-center items-center min-h-full p-0 sm:p-4 relative z-10"
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
                  <IonIcon icon={sparkles} className="size-7 text-white/80" />
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

              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {fields.slice(0, 2).map((field) => (
                    <div key={field.name} className="relative">
                      <IonIcon icon={field.icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none z-10" />
                      <IonInput
                        type={field.type}
                        value={formData[field.name]}
                        onIonInput={(e) => handleChange(field.name, e.detail.value)}
                        required
                        placeholder={field.placeholder}
                        className="custom-input pl-10"
                        mode="md"
                      />
                    </div>
                  ))}
                </div>

                {fields.slice(2).map((field) => (
                  <div key={field.name} className="relative">
                    <IonIcon icon={field.icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none z-10" />
                    <IonInput
                      type={field.type}
                      value={formData[field.name]}
                      onIonInput={(e) => handleChange(field.name, e.detail.value)}
                      required
                      placeholder={field.placeholder}
                      className="custom-input pl-10"
                      mode="md"
                    />
                  </div>
                ))}

                <div className="relative">
                  <IonIcon icon={lockClosedOutline} className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none z-10" />
                  <IonInput
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onIonInput={(e) => handleChange('password', e.detail.value)}
                    required
                    minlength={6}
                    placeholder="Password (min. 6 characters)"
                    className="custom-input pl-10 pr-11"
                    mode="md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors z-10"
                    tabIndex={-1}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} className="size-4" />
                  </button>
                </div>

                <IonButton
                  type="submit"
                  disabled={loading}
                  expand="block"
                  className="mt-2"
                >
                  {loading ? (
                    <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </IonButton>
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
        </div>
        {!isNative && <WebFooter />}
      </IonContent>
    </IonPage>
  )
}
