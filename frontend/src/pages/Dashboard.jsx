import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import MonthlyTableView from '../components/MonthlyTableView';
import StatsCard from '../components/StatsCard';
import { LogOut, Activity, User } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-7 rounded-full border-2 border-zinc-700 border-t-zinc-100 animate-spin" />
          <p className="text-sm text-zinc-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-xl bg-sky-500/10">
                <Activity className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-100">SugarTrack</h1>
                <p className="text-[11px] text-zinc-500 -mt-0.5">Glucose tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pr-3 border-r border-zinc-800">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-zinc-100">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                  </span>
                  <span className="text-[11px] text-zinc-500">Member</span>
                </div>
                <div className="size-9 rounded-full bg-zinc-800 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="size-full object-cover rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {trends && <StatsCard trends={trends} />}
        <MonthlyTableView entries={entries} onDataChange={handleDataChange} />
      </main>
    </div>
  );
}
