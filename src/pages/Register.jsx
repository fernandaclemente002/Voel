import { useState } from 'react'
import { supabase } from '../library/supabase'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password)
    )
  }

  async function handleRegister(e) {
    e.preventDefault()

    if (!isStrongPassword(password)) {
      alert('Senha fraca. Use 8+ caracteres, letra maiúscula e número.')
      return
    }

    if (password !== confirmPassword) {
      alert('As senhas não coincidem.')
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Cadastro feito! Verifique seu e-mail.')
    }
  }

  return (
    <div>
      <h2>Criar conta</h2>

      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <br />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <br />

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />

        <br />

        <button type="submit">Cadastrar</button>
      </form>
    </div>
  )
}

export default Register