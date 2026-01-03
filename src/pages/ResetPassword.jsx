import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../library/supabase'

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Escuta mudanças na autenticação para capturar o evento de recuperação de senha
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Usuário veio pelo link de recuperação.");
      } else if (event === "SIGNED_OUT") {
        // Se não houver evento de recuperação ou sessão, manda para o login
        alert('Sessão inválida ou link expirado.');
        navigate('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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

    // O updateUser funciona porque o Supabase já autenticou o usuário via link do email
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