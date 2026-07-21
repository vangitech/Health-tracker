import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import Footer from '../components/Footer';
import { useBiometrics } from '../hooks/useBiometrics';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, User, Camera, Loader2, Fingerprint, ShieldCheck, ShieldOff, LogOut } from 'lucide-react';

export default function Settings() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const {
    biometricAvailable,
    biometricsEnabled,
    loading: bioLoading,
    saveCredentials,
    deleteCredentials,
  } = useBiometrics();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.put('/api/auth/profile', formData);
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleBiometricToggle = async () => {
    setSaving(true);
    if (biometricsEnabled) {
      await deleteCredentials();
    } else {
      await saveCredentials(user?.email || '', '');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3 h-14">
            <button
              onClick={() => navigate('/')}
              className="size-8 rounded-xl bg-zinc-800/60 flex items-center justify-center hover:bg-zinc-700/60 transition-colors"
            >
              <ArrowLeft className="size-4 text-zinc-400" />
            </button>
            <h1 className="text-base font-semibold text-zinc-100">Settings</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6 pb-[env(safe-area-inset-bottom)]">
        {error && (
          <div className="bg-red-900/20 border border-red-800/30 text-red-400 p-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Profile Section */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative size-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden group shrink-0"
            >
              {uploading ? (
                <Loader2 className="size-5 text-zinc-400 animate-spin" />
              ) : user?.avatar ? (
                <>
                  <img src={user.avatar} alt="" className="size-full object-cover rounded-full" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="size-5 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <User className="size-6 text-zinc-400" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="size-5 text-white" />
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Biometric Section */}
        {isNative && biometricAvailable && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-9 rounded-xl bg-emerald-900/30 flex items-center justify-center">
                  <Fingerprint className="size-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">Biometric Login</p>
                  <p className="text-xs text-zinc-500">Use fingerprint or face to sign in</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-zinc-300">{biometricsEnabled ? 'Enabled' : 'Disabled'}</span>
                <button
                  onClick={handleBiometricToggle}
                  disabled={saving || bioLoading}
                  className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                    biometricsEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                      biometricsEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
              </div>
              {!biometricsEnabled && (
                <p className="text-xs text-zinc-600 mt-2">
                  After enabling, you'll be prompted for biometrics when logging in.
                </p>
              )}
              {biometricsEnabled && (
                <p className="text-xs text-zinc-600 mt-2">
                  Disabling will remove stored credentials. You'll need to enter your password next time.
                </p>
              )}
            </div>
          </section>
        )}

        {isNative && !biometricAvailable && !bioLoading && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-4 flex items-center gap-3 opacity-50">
              <div className="size-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                <ShieldOff className="size-4 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">Biometric Login</p>
                <p className="text-xs text-zinc-500">Not available on this device</p>
              </div>
            </div>
          </section>
        )}

        {/* Sign Out */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-xl border border-zinc-800 transition-colors"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </main>
      <Footer />
    </div>
  );
}
