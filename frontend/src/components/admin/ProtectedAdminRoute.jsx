import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  const [platform, setPlatform] = useState('web');

  useEffect(() => {
    import('@capacitor/core')
      .then(({ Capacitor }) => setPlatform(Capacitor.isNativePlatform() ? 'native' : 'web'))
      .catch(() => setPlatform('web'));
  }, []);

  if (platform === 'native') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="size-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/iaccess" replace />;
  }

  return children;
}
