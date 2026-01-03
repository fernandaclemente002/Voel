import { Link } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../library/supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
      alert('Login realizado com sucesso')
    }
  }

  return (
    <div>
      <h2>Entrar</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <br />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <br />

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
        {/* A O LINK pra conectar com a página Reset-password */}
    <p>
  <Link to="/forgot-password">Esqueci minha senha</Link>
</p>
    </div>
  )
}

export default Login
