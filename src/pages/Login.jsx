import { Link, useNavigate } from 'react-router-dom' // Importação única e correta
import { useState } from 'react'
import { supabase } from '../library/supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate() // 1. Inicializa o hook de navegação

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      // 2. Após o login, manda o usuário para a Home
      navigate('/home') 
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
    />

    <input
      type="password"
      placeholder="Senha"
      className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
      value={password}
      onChange={e => setPassword(e.target.value)}
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
    className="animate-shine group relative w-full max-w-[250px] flex justify-center py-3.5 px-4 border border-transparent text-xs font-bold rounded-full text-white bg-voel-charcoal hover:bg-voel-gold focus:outline-none transition-all duration-500 shadow-lg active:scale-95 disabled:opacity-50 tracking-[0.2em]"
  >
    {loading ? 'CARREGANDO...' : 'ENTRAR'}
  </button>
</form>
    </div>
  </div>
)
}

export default Login