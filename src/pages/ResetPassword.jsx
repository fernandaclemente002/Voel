import { useState } from 'react'
import { supabase } from '../library/supabase'

function ForgotPassword() {
  const [email, setEmail] = useState('')

  async function handleReset(e) {
    e.preventDefault()

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://voel.vercel.app/reset-password'
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Verifique seu email para redefinir a senha!')
    }
  }

  return (
    <div>
      <h2>Esqueci minha senha</h2>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <br />
        <button type="submit">Enviar link de redefinição</button>
      </form>
    </div>
  )
}

export default ForgotPassword
