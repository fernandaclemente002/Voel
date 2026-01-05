import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../library/supabase'

function Login() {
  // Função para extrair o e-mail da URL
  const getEmailFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    return emailParam ? decodeURIComponent(emailParam) : '';
  };

  // Iniciamos o estado diretamente com o valor da URL
  const [email, setEmail] = useState(getEmailFromUrl());
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Efeito Único para capturar e-mail da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, []); // Executa apenas ao montar o componente

  // 2. Função de persistência de contas aprimorada
  const saveAccountToLocal = (user) => {
    let accounts = JSON.parse(localStorage.getItem('voel_accounts') || '[]');
    
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split('@')[0]
    };

    // CORREÇÃO: Remove qualquer vestígio do ID antigo ou E-mail antigo antes de salvar o atual
    // Isso impede que a "conta fantasma" (e-mail velho) coexista com a nova.
    accounts = accounts.filter(acc => acc.id !== user.id && acc.email !== user.email);
    
    // Adiciona a versão atualizada
    accounts.push(userData);
    
    localStorage.setItem('voel_accounts', JSON.stringify(accounts));
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      saveAccountToLocal(data.user);
      setLoading(false);
      navigate('/home'); 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-voel-beige px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-serif font-light text-voel-charcoal tracking-[0.3em] uppercase">
            VÖEL
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 font-sans">
            Elegância em cada detalhe.
          </p>
        </div>

        <form className="mt-8 space-y-6 flex flex-col items-center" onSubmit={handleLogin}>
          <div className="space-y-4 w-full">
            <input
              type="email"
              placeholder="E-mail"
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Senha"
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between w-full px-1">
            <Link to="/forgot-password" size="sm" className="text-[11px] font-medium text-voel-gold hover:text-voel-charcoal transition-colors uppercase tracking-wider">
              Esqueci minha senha
            </Link>
            <Link to="/register" className="text-[11px] font-medium text-voel-gold hover:text-voel-charcoal transition-colors uppercase tracking-wider">
              Criar conta
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="animate-shine group relative w-full max-w-[250px] flex justify-center py-3.5 px-4 border border-transparent text-xs font-bold rounded-full text-white bg-voel-charcoal 
                       hover:bg-voel-gold active:bg-voel-gold-dark active:scale-95 
                       transition-all duration-300 shadow-lg disabled:opacity-50 tracking-[0.2em]"
          >
            {loading ? 'CARREGANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login