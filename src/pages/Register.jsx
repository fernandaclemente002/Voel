import { useState } from 'react'
import { supabase } from '../library/supabase'
import { useNavigate, Link } from 'react-router-dom' // Adicionado para navegação

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate() // Inicializa o hook de navegação

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
      // Redireciona para o login para que o usuário entre após confirmar o e-mail
      navigate('/login')
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

        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      {/* Link para voltar ao Login */}
      <p style={{ marginTop: '15px' }}>
        Já tem uma conta? <Link to="/login">Faça login</Link>
      </p>
    </div>
  )
}

export default Register