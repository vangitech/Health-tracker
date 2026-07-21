import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import Patients from './pages/admin/Patients';
import PatientDetail from './pages/admin/PatientDetail';
import SugarRange from './pages/admin/SugarRange';
import Appointments from './pages/admin/Appointments';
import Chat from './pages/admin/Chat';
import AdminSettings from './pages/admin/Settings';
import AdminManagement from './pages/admin/AdminManagement';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-black">
        <div className="size-6 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route path="/iaccess" element={<AdminLogin />} />
      <Route
        path="/iaccess/*"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<AnalyticsDashboard />} />
                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route path="sugar-range" element={<SugarRange />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="chat" element={<Chat />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="admins" element={<AdminManagement />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('@capacitor/status-bar')
      .then(({ StatusBar }) => {
        StatusBar.setOverlaysWebView({ overlay: false });
        StatusBar.setStyle({ style: 'DARK' });
        StatusBar.setBackgroundColor({ color: '#09090b' });
      })
      .catch(() => {
        // Capacitor not available (web)
      });

    import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => {
        SplashScreen.hide();
      })
      .catch(() => {
        // Capacitor not available (web)
      });

    import('@capacitor/local-notifications')
      .then(({ LocalNotifications, Channel }) => {
        LocalNotifications.createChannel({
          id: 'fbs-alarm',
          name: 'FBS Reminder',
          description: 'Reminds you to check your fasting blood sugar',
          importance: 4,
          visibility: 1,
          sound: 'default',
          vibration: true,
          lights: true,
        }).catch(() => {});
      })
      .catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <div className="overflow-x-hidden">
          <AppContent />
        </div>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
