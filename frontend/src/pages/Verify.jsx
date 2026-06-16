import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../lib/axios'
import { IonPage, IonContent, IonInput, IonButton, IonIcon } from '@ionic/react'
import { Capacitor } from '@capacitor/core'
import { motion } from 'framer-motion'
import WebFooter from '../components/WebFooter'
import { sparkles, checkmarkCircle } from 'ionicons/icons'

const isNative = Capacitor.isNativePlatform()

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function Verify() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || sessionStorage.getItem('verifyEmail')

  useEffect(() => {
    if (!email) {
      navigate('/register')
    }
  }, [email, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/verify', { email, code })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      await axios.post('/api/auth/resend-code', { email })
      setError('')
    } catch (err) {
      setError('Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

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
              {success ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <IonIcon icon={checkmarkCircle} className="size-16 text-emerald-400 mx-auto mb-4" />
                  <p className="text-emerald-400 font-medium">Email verified!</p>
                  <p className="text-zinc-500 text-sm mt-1">Redirecting to sign in...</p>
                </motion.div>
              ) : (
                <>
                  <motion.div variants={itemVariants} className="text-center mb-6">
                    <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
                      <IonIcon icon={sparkles} className="size-7 text-white/80" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight">
                      Verify Your Email
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1.5">
                      We sent a 6-digit code to<br />
                      <span className="text-zinc-300 font-medium">{email}</span>
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
                    <IonInput
                      type="text"
                      value={code}
                      onIonInput={(e) => setCode(e.detail.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxlength={6}
                      inputmode="numeric"
                      placeholder="000000"
                      className="verify-input text-center text-3xl tracking-[0.5em]"
                      mode="md"
                    />

                    <IonButton
                      type="submit"
                      disabled={loading || code.length !== 6}
                      expand="block"
                    >
                      {loading ? (
                        <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        'Verify Email'
                      )}
                    </IonButton>
                  </motion.form>

                  <motion.div variants={itemVariants} className="mt-6 text-center">
                    <p className="text-sm text-zinc-500">
                      Didn't receive code?{' '}
                      <button
                        onClick={handleResend}
                        disabled={loading}
                        className="text-zinc-300 font-medium hover:text-white transition-colors"
                      >
                        Resend
                      </button>
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
        {!isNative && <WebFooter />}
      </IonContent>
    </IonPage>
  )
}
