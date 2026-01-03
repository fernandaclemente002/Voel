import { useState } from 'react'
import { supabase } from '../library/supabase'
import { Link } from 'react-router-dom'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSendEmail(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://voel-lovat.vercel.app/reset-password',
    })

    setLoading(false)

    if (error) {
      alert("Erro: " + error.message)
    } else {
      setSent(true)
      alert('Link enviado! Verifique sua caixa de entrada.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-voel-beige px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-serif font-light text-voel-charcoal tracking-[0.3em] uppercase">
            VÖEL
          </h2>
          <p className="mt-4 text-sm text-gray-500 font-sans italic">
            {!sent ? "Recuperação de conta" : "Verifique seu e-mail"}
          </p>
        </div>

        {!sent ? (
          <form className="mt-8 space-y-6 flex flex-col items-center" onSubmit={handleSendEmail}>
            <p className="text-xs text-gray-400 uppercase tracking-widest leading-relaxed">
              Digite seu e-mail para receber o link de redefinição.
            </p>
            
            <input
              type="email"
              placeholder="Seu e-mail cadastrado"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="animate-shine group relative w-full max-w-[250px] flex justify-center py-3.5 px-4 border border-transparent text-xs font-bold rounded-full text-white bg-voel-charcoal hover:bg-voel-gold focus:outline-none transition-all duration-500 shadow-lg active:scale-95 disabled:opacity-50 tracking-[0.2em]"
            >
              {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4 py-4">
            <p className="text-sm text-voel-gold font-medium">
              Sucesso! O link foi enviado para: <br/>
              <span className="text-voel-charcoal font-bold">{email}</span>
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Acesse seu e-mail e clique no link para criar uma nova senha.
            </p>
          </div>
        )}

        <div className="mt-6">
          <Link to="/login" className="text-[11px] font-medium text-voel-gold hover:text-voel-charcoal transition-colors uppercase tracking-wider">
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword