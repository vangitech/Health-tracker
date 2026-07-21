import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import Footer from '../components/Footer';
import { getApiUrl } from '../lib/axios';

const API = getApiUrl();

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const DOTS = Array.from({ length: 20 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 3 + Math.random() * 4,
  delay: Math.random() * 3,
}));

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" rx="1" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" rx="1" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" rx="1" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" rx="1" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      if (errorParam === 'oauth_failed') {
        setError('Social login failed. Please try again.');
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Check your connection and ensure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = (provider) => {
    setLoading(true);
    setError('');
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${API}/api/auth/signin/${provider}`;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'json';
    input.value = 'true';
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  };

  const socialProviders = [
    { name: 'Google', icon: GoogleIcon, provider: 'google' },
    { name: 'Apple', icon: AppleIcon, provider: 'apple' },
    { name: 'Microsoft', icon: MicrosoftIcon, provider: 'microsoft-entra-id' },
  ];

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden bg-black select-none pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/2 rounded-full blur-3xl" />
        {DOTS.map((d, i) => (
          <motion.div
            key={i}
            className="absolute size-1 bg-white/10 rounded-full"
            style={{ left: `${d.left}%`, top: `${d.top}%` }}
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
            transition={{
              duration: d.duration,
              repeat: Infinity,
              delay: d.delay,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        className="flex-1 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 relative z-10"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? 'visible' : 'hidden'}
          className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl px-6 pt-8 pb-10 sm:pb-8"
          style={{
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Sparkles className="size-7 text-white/80" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Blood Sugar Tracker</h1>
            <p className="text-sm text-zinc-400 mt-1.5">Sign in to continue tracking</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="space-y-2.5 mb-6">
            {socialProviders.map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleSocialSignIn(provider.provider)}
                disabled={loading}
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 text-sm font-medium transition-all duration-200 active:scale-[0.98] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <provider.icon />
                Continue with {provider.name}
              </button>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
                className="w-full h-12 pl-10 pr-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
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
              className="relative w-full h-12 bg-white text-black font-medium rounded-xl text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90"
            >
              {loading ? <Loader2 className="size-5 animate-spin mx-auto" /> : 'Sign In'}
            </button>
          </motion.form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-zinc-300 font-medium hover:text-white transition-colors">
                Sign Up
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
      <Footer />
    </div>
  );
}
