import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AdminLoginProps {
  navigate: (path: string) => void;
}

export default function AdminLogin({ navigate }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin');
    });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!supabase) {
      setError('Supabase precisa ser configurado para autenticar o administrador.');
      return;
    }

    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError('E-mail ou senha inválidos.');
      return;
    }

    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] px-4 py-10 text-[#3D3835]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <button
          onClick={() => navigate('/')}
          className="flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8B7355] transition-colors hover:text-[#3D3835]"
          type="button"
        >
          <ArrowLeft size={16} /> Voltar ao site
        </button>

        <div className="rounded-lg border border-[#E5E0D8] bg-white p-8 shadow-sm">
          <div className="mb-8 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8B7355]">Área administrativa</p>
            <h1 className="font-serif text-3xl uppercase tracking-[0.25em]">VÖEL</h1>
            <p className="text-sm leading-relaxed text-[#7A7067]">Acesso exclusivo para a dona da loja gerenciar catálogo, imagens e categorias.</p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
              Supabase precisa ser configurado antes do login. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`.
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#7A7067]">E-mail</span>
              <span className="flex items-center gap-3 rounded-lg border border-[#E5E0D8] bg-[#FDFCF7] px-3 py-3 focus-within:border-[#8B7355]">
                <Mail size={18} className="text-[#9B8F7E]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="admin@loja.com"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#7A7067]">Senha</span>
              <span className="flex items-center gap-3 rounded-lg border border-[#E5E0D8] bg-[#FDFCF7] px-3 py-3 focus-within:border-[#8B7355]">
                <Lock size={18} className="text-[#9B8F7E]" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                />
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isSupabaseConfigured}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3D3835] px-4 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#8B7355] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
