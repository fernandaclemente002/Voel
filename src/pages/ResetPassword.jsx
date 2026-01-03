import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../library/supabase'

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // O Supabase envia o token no hash da URL (#access_token=...)
    // Esta função verifica se estamos autenticados via link de recuperação
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      
      // Se não houver sessão ativa, o link pode ser inválido ou expirado
      if (!data.session) {
        alert('Sessão inválida ou link expirado. Solicite um novo e-mail.')
        navigate('/login')
      }
    }

    checkSession()
  }, [navigate])

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

    // Aqui não precisamos passar o token manualmente, 
    // o Supabase já o validou na sessão ao abrir o link
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Senha redefinida com sucesso! Faça login agora.')
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
          required
        />
        <br />
        <input
          type="password"
          placeholder="Confirme a nova senha"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
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