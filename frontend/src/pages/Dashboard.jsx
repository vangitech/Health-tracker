import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import MonthlyTableView from '../components/MonthlyTableView';
import StatsCard from '../components/StatsCard';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Activity,
  User,
  Camera,
  Loader2,
  Calendar,
  Bell,
  BellOff,
  Coffee,
  Settings as SettingsIcon,
  AlarmClock,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [activeTab, setActiveTab] = useState('entries');
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [alarmEnabled, setAlarmEnabled] = useState(() => localStorage.getItem('fbs_alarm') !== 'off');
  const [alarmRinging, setAlarmRinging] = useState(false);
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const [showAlarmMenu, setShowAlarmMenu] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setDataError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.put('/api/auth/profile', formData);
      setUser(res.data.user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload avatar';
      setDataError(msg);
      console.error('Failed to upload avatar', err);
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const fetchData = async () => {
    try {
      setDataError('');
      const [entriesRes, trendsRes] = await Promise.all([axios.get('/api/entries'), axios.get('/api/trends')]);
      setEntries(entriesRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Failed to load data';
      setDataError(msg);
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer fetching to avoid synchronous setState calls during render/effect execution
    const t = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const res = await axios.get('/api/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const scheduleAlarm = async () => {
    if (!isNative) return;
    try {
      const { permission } = await LocalNotifications.requestPermissions();
      if (permission !== 'granted') return;
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      const now = new Date();
      const scheduled = new Date(now);
      scheduled.setHours(7, 0, 0, 0);
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'FBS Reminder',
            body: 'Time to check your fasting blood sugar!',
            id: 1,
            schedule: { at: scheduled, every: 'day', count: 1 },
            sound: 'default',
            ...(Capacitor.getPlatform() === 'android' ? { channelId: 'fbs-alarm' } : {}),
          },
        ],
      });
    } catch {}
  };

  const cancelAlarm = async () => {
    if (!isNative) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    } catch {}
  };

  const toggleAlarm = () => {
    const next = !alarmEnabled;
    setAlarmEnabled(next);
    localStorage.setItem('fbs_alarm', next ? 'on' : 'off');
    if (!next) {
      setAlarmRinging(false);
      setAlarmDismissed(false);
      cancelAlarm();
    } else {
      scheduleAlarm();
    }
  };

  const dismissAlarm = () => {
    setAlarmRinging(false);
    setAlarmDismissed(true);
  };

  useEffect(() => {
    if (!alarmEnabled) {
      setAlarmRinging(false);
      return;
    }
    scheduleAlarm();
    const check = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const inWindow = (h >= 7 && h < 9) || (h === 9 && m === 0);
      if (inWindow && !alarmDismissed) {
        setAlarmRinging(true);
      } else if (!inWindow) {
        setAlarmRinging(false);
        setAlarmDismissed(false);
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [alarmEnabled, alarmDismissed]);

  useEffect(() => {
    if (!isNative || !alarmEnabled) return;
    let unregister;
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      if (notification.id === 1) {
        const now = new Date();
        const h = now.getHours();
        if (h >= 7 && h < 9) {
          setAlarmRinging(true);
        }
      }
    }).then((handle) => {
      unregister = handle;
    });
    return () => {
      if (unregister) unregister.remove();
    };
  }, [alarmEnabled, isNative]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && alarmEnabled) {
        const now = new Date();
        const h = now.getHours();
        const inWindow = (h >= 7 && h < 9) || (h === 9 && now.getMinutes() === 0);
        if (inWindow && !alarmDismissed) {
          setAlarmRinging(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [alarmEnabled, alarmDismissed]);

  const handleDataChange = (savedEntry) => {
    setDataError('');
    if (savedEntry) {
      setEntries((prev) => {
        if (savedEntry._deleted) {
          return prev.filter((e) => e._id !== savedEntry._id);
        }
        const idx = prev.findIndex((e) => e._id === savedEntry._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = savedEntry;
          return next;
        }
        return [savedEntry, ...prev];
      });
    }
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

            <nav className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('entries')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === 'entries' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Activity className="size-3.5 inline mr-1" />
                Entries
              </button>
              <button
                onClick={() => {
                  setActiveTab('appointments');
                  fetchAppointments();
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === 'appointments' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Calendar className="size-3.5 inline mr-1" />
                Appointments
              </button>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setActiveTab(activeTab === 'entries' ? 'appointments' : 'entries')}
                className="sm:hidden flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                {activeTab === 'entries' ? <Calendar className="size-3.5" /> : <Activity className="size-3.5" />}
                <span>{activeTab === 'entries' ? 'Appointments' : 'Entries'}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowAlarmMenu((p) => !p)}
                  className={`relative size-8 sm:size-9 rounded-xl flex items-center justify-center transition-colors ${
                    alarmRinging
                      ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                      : alarmEnabled
                        ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-100'
                        : 'bg-zinc-800/30 text-zinc-600'
                  }`}
                  title={alarmEnabled ? 'FBS Alarm active (7-9 AM)' : 'FBS Alarm disabled'}
                >
                  {alarmRinging ? <Bell className="size-4 sm:size-5" /> : <BellOff className="size-4 sm:size-4" />}
                </button>

                {showAlarmMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAlarmMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
                      <div className="p-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Coffee className="size-4 text-amber-400" />
                          <span className="text-sm font-medium text-zinc-100">FBS Reminder</span>
                        </div>
                      </div>
                      <div className="p-3 space-y-3">
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Reminds you to check your{' '}
                          <span className="text-zinc-100 font-medium">Fasting Blood Sugar</span> between 7:00 AM – 9:00
                          AM daily.
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-300">Alarm</span>
                          <button
                            onClick={toggleAlarm}
                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                              alarmEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                                alarmEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
                              }`}
                            />
                          </button>
                        </div>
                        {alarmRinging && (
                          <button
                            onClick={dismissAlarm}
                            className="w-full py-2 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-colors"
                          >
                            Dismiss for today
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Link
                to="/settings"
                className="size-8 sm:size-9 rounded-xl bg-zinc-800/30 flex items-center justify-center hover:bg-zinc-700/60 transition-colors text-zinc-500 hover:text-zinc-100"
              >
                <SettingsIcon className="size-4 sm:size-4" />
              </Link>

              <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-zinc-800">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-zinc-100">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                  </span>
                  <span className="text-[11px] text-zinc-500">Member</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={uploading}
                    className="relative size-8 sm:size-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden group hover:ring-2 hover:ring-zinc-600 transition-all shrink-0"
                  >
                    {uploading ? (
                      <Loader2 className="size-4 text-zinc-400 animate-spin" />
                    ) : user?.avatar ? (
                      <>
                        <img src={user.avatar} alt="" className="size-full object-cover rounded-full" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                          <Camera className="size-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-zinc-400" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                          <Camera className="size-4 text-white" />
                        </div>
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <SettingsIcon className="size-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Camera className="size-4" />
                    <span>Change Photo</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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

      {alarmRinging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm mx-auto p-6 sm:p-8 text-center shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center size-16 sm:size-20 rounded-full bg-amber-500/20 mx-auto mb-4 sm:mb-5 animate-pulse">
              <AlarmClock className="size-8 sm:size-10 text-amber-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mb-2">Time to Check!</h2>
            <p className="text-sm text-zinc-400 mb-5 sm:mb-6">Your fasting blood sugar reminder</p>
            <button
              onClick={dismissAlarm}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-[env(safe-area-inset-bottom)]">
        {activeTab === 'entries' && (
          <>
            {dataError && (
              <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 text-red-400 p-3 sm:p-4 rounded-xl text-sm">
                <span className="flex-1">{dataError}</span>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 bg-red-800/40 hover:bg-red-700/50 rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  Retry
                </button>
              </div>
            )}
            <StatsCard trends={trends} />
            <MonthlyTableView entries={entries} onDataChange={handleDataChange} />
          </>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-zinc-100">My Appointments</h2>
            </div>

            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 text-zinc-400 animate-spin" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Calendar className="size-10 text-zinc-600" />
                <p className="text-sm text-zinc-500">No appointments scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => {
                  const date = new Date(apt.appointmentDate);
                  const isPast = date < new Date();
                  return (
                    <div
                      key={apt._id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50"
                    >
                      <div className="flex flex-col items-center justify-center size-12 rounded-lg bg-sky-500/10 shrink-0">
                        <span className="text-lg font-bold text-sky-400 leading-tight">{date.getDate()}</span>
                        <span className="text-[10px] text-sky-400/70 leading-tight">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100">
                          {date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {date.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {apt.notes && <p className="text-sm text-zinc-400 mt-2">{apt.notes}</p>}
                        {apt.createdBy && (
                          <p className="text-[11px] text-zinc-600 mt-1.5">
                            Booked by {apt.createdBy.firstName} {apt.createdBy.lastName}
                            {apt.createdBy.role && ` (${apt.createdBy.role})`}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          apt.status === 'completed'
                            ? 'bg-green-900/40 text-green-400'
                            : apt.status === 'cancelled'
                              ? 'bg-red-900/40 text-red-400'
                              : isPast
                                ? 'bg-zinc-800 text-zinc-500'
                                : 'bg-blue-900/40 text-blue-400'
                        }`}
                      >
                        {apt.status === 'scheduled' && isPast ? 'Missed' : apt.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
