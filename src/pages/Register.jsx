import { useState } from 'react'
import { supabase } from '../library/supabase'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Sua função de segurança original
  function isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password)
    )
  }

  async function handleRegister(e) {
    e.preventDefault()

    // Validação de senha forte (Sua lógica)
    if (!isStrongPassword(password)) {
      alert('Senha fraca. Use 8+ caracteres, letra maiúscula e número.')
      return
    }

    // Validação de coincidência
    if (password !== confirmPassword) {
      alert('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-voel-beige px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-serif font-light text-voel-charcoal tracking-[0.3em] uppercase">
            VÖEL
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 font-sans italic">
            Crie sua conta e sinta a essência.
          </p>
        </div>

        <form className="mt-8 space-y-5 flex flex-col items-center" onSubmit={handleRegister}>
          <div className="space-y-4 w-full">
            <input
              type="email"
              placeholder="E-mail"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Senha (8+ caracteres, A-Z, 0-9)"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirmar Senha"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="text-center w-full">
            <Link to="/login" className="text-[11px] font-medium text-voel-gold hover:text-voel-charcoal transition-colors uppercase tracking-wider">
              Já tenho uma conta. Fazer Login
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="animate-shine group relative w-full max-w-[250px] flex justify-center py-3.5 px-4 border border-transparent text-xs font-bold rounded-full text-white bg-voel-charcoal hover:bg-voel-gold focus:outline-none transition-all duration-500 shadow-lg active:scale-95 disabled:opacity-50 tracking-[0.2em]"
          >
            {loading ? 'CADASTRANDO...' : 'CRIAR CONTA'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register