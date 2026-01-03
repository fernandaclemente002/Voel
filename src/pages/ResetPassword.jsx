import { useState } from 'react'
import { supabase } from '../library/supabase'

function ResetPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://voel-lovat.vercel.app/login'
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Email de redefinição enviado! Verifique sua caixa de entrada.')
    }
  }

  return (
    <div>
      <h2>Redefinir senha</h2>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar email'}
        </button>
      </form>
    </div>
  )
}

export default ResetPassword
