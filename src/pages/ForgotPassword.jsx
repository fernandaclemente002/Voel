import { useState } from 'react'
import { supabase } from '../library/supabase'
import { Link } from 'react-router-dom'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendEmail(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Este link deve estar cadastrado no painel do Supabase (Redirect URLs)
      redirectTo: 'https://voel-lovat.vercel.app/reset-password',
    })

    setLoading(false)

    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert('Link enviado! Verifique sua caixa de entrada e spam.')
    }
  }

  return (
    <div>
      <h2>Recuperar Senha</h2>
      <p>Digite seu e-mail para receber o link de redefinição.</p>
      <form onSubmit={handleSendEmail}>
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar e-mail de recuperação'}
        </button>
      </form>
      <Link to="/login">Voltar para o Login</Link>
    </div>
  )
}

export default ForgotPassword