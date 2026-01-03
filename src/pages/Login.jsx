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
        <h2 className="mt-6 text-center text-3xl font-serif font-light text-voel-charcoal tracking-widest uppercase">
          VOEL
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-sans">
          Elegância em cada detalhe.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="appearance-none relative block w-full px-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-voel-gold focus:border-voel-gold sm:text-sm transition-all"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            className="appearance-none relative block w-full px-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-voel-gold focus:border-voel-gold sm:text-sm transition-all"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <Link to="/forgot-password" size="sm" className="font-medium text-voel-gold hover:text-voel-charcoal transition-colors">
            Esqueci minha senha
          </Link>
          <Link to="/register" className="font-medium text-voel-gold hover:text-voel-charcoal transition-colors">
            Criar conta
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-voel-charcoal hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-voel-charcoal transition-all disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'ENTRAR'}
        </button>
      </form>
    </div>
  </div>
)
}

export default Login