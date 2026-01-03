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

      <p>
        <Link to="/forgot-password">Esqueci minha senha</Link>
      </p>

      <p>
        Não tem uma conta? <Link to="/register">Cadastre-se</Link>
      </p>

    </div>
  )
}

export default Login