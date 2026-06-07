import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, ShieldCheck } from 'lucide-react';
import AdminDashboard from './admin/AdminDashboard';
import AdminLogin from './admin/AdminLogin';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import PublicCatalog from './public/PublicCatalog';

function useCurrentPath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('voel:navigate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('voel:navigate', handleLocationChange);
    };
  }, []);

  return path;
}

function AdminConfigMissing({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFCF7] px-4 text-[#3D3835]">
      <div className="w-full max-w-lg rounded-lg border border-[#E5E0D8] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F1EC] text-[#8B7355]">
          <ShieldCheck size={26} />
        </div>
        <h1 className="font-serif text-2xl uppercase tracking-[0.25em]">Supabase</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#7A7067]">
          Configure as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_SUPABASE_STORAGE_BUCKET`
          para liberar o painel administrativo.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-lg bg-[#3D3835] px-5 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#8B7355]"
          type="button"
        >
          Voltar ao site
        </button>
      </div>
    </div>
  );
}

function ProtectedAdminRoute({ navigate }: { navigate: (path: string) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isCheckingSession && !session && isSupabaseConfigured) {
      navigate('/admin/login');
    }
  }, [isCheckingSession, navigate, session]);

  if (!isSupabaseConfigured) {
    return <AdminConfigMissing navigate={navigate} />;
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFCF7] text-[#8B7355]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!session) return null;

  return <AdminDashboard navigate={navigate} session={session} />;
}

export default function App() {
  const path = useCurrentPath();

  const navigate = useCallback((nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.dispatchEvent(new Event('voel:navigate'));
  }, []);

  if (path === '/admin/login') {
    return <AdminLogin navigate={navigate} />;
  }

  if (path.startsWith('/admin')) {
    return <ProtectedAdminRoute navigate={navigate} />;
  }

  return <PublicCatalog />;
}
