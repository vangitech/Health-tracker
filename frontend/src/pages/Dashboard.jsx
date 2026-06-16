import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import MonthlyTableView from '../components/MonthlyTableView';
import StatsCard from '../components/StatsCard';
import Footer from '../components/Footer';
import { LogOut, Activity, User, Camera, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, setUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.put('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setUploading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [entriesRes, trendsRes] = await Promise.all([
        axios.get('/api/entries'),
        axios.get('/api/trends')
      ]);
      setEntries(entriesRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [entriesRes, trendsRes] = await Promise.all([
          axios.get('/api/entries'),
          axios.get('/api/trends')
        ])
        if (cancelled) return
        setEntries(entriesRes.data)
        setTrends(trendsRes.data)
      } catch (error) {
        console.error('Failed to fetch data', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, []);

  const handleDataChange = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-7 rounded-full border-2 border-zinc-700 border-t-zinc-100 animate-spin" />
          <p className="text-sm text-zinc-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center justify-center size-8 sm:size-9 rounded-xl bg-sky-500/10 shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">SugarTrack</h1>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 -mt-0.5 truncate">Glucose tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-zinc-800">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-zinc-100">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                  </span>
                  <span className="text-[11px] text-zinc-500">Member</span>
                </div>
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="relative size-8 sm:size-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden group hover:ring-2 hover:ring-zinc-600 transition-all shrink-0"
              >
                {uploading ? (
                  <Loader2 className="size-4 text-zinc-400 animate-spin" />
                ) : user?.avatar ? (
                  <>
                    <img src={user.avatar} alt="" className="size-full object-cover rounded-full" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="size-4 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-zinc-400 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Camera className="size-4 text-white" />
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

              <button
                onClick={logout}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-[env(safe-area-inset-bottom)]">
        <StatsCard trends={trends} />
        <MonthlyTableView entries={entries} onDataChange={handleDataChange} />
      </main>
      <Footer />
    </div>
  );
}
