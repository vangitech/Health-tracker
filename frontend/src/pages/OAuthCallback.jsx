import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem('token');
    if (stored) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
    }
    (async () => {
      try {
        const res = await axios.get('/api/auth/me');
        if (!cancelled) {
          const user = res.data.user || res.data;
          if (user) {
            navigate('/', { replace: true });
          } else {
            setError('Authentication failed.');
            setTimeout(() => navigate('/login', { replace: true }), 2000);
          }
        }
      } catch {
        if (!cancelled) {
          setError('Authentication failed.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-black flex items-center justify-center">
      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <Loader2 className="size-8 text-white/60 animate-spin" />
      )}
    </div>
  );
}
