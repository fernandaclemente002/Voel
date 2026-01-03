import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../library/supabase'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('access_token') // token enviado no email

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      alert('Link inválido ou expirado')
      navigate('/login')
    }
  }, [token])

  function isStrongPassword(pw) {
    return pw.length >= 8 && /[A-Z]/.test(pw) && /\d/.test(pw)
  }

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('As senhas não conferem!')
      return
    }

    if (!isStrongPassword(password)) {
      alert('Senha fraca! Use 8+ caracteres, letra maiúscula e número.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    }, token)

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Senha redefinida com sucesso! Faça login.')
      navigate('/login')
    }
  }

  return (
    <div>
      <h2>Redefinir senha</h2>
      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Confirme a nova senha"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Redefinindo...' : 'Redefinir senha'}
        </button>
      </form>
    </div>
  )
}

export default ResetPassword
