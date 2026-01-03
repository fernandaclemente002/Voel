import { useState } from 'react'
import { supabase } from '../library/supabase'
import { Link } from 'react-router-dom'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false) // Para mostrar mensagem de sucesso

  async function handleSendEmail(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // O link que o usuário clicará no e-mail levará para a página de Reset
      redirectTo: 'https://voel-lovat.vercel.app/reset-password',
    })

    setLoading(false)

    if (error) {
      alert("Erro: " + error.message)
    } else {
      setSent(true)
      alert('Link enviado! Verifique sua caixa de entrada.')
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Recuperar Senha</h2>
      
      {!sent ? (
        <>
          <p>Digite seu e-mail para receber o link de redefinição.</p>
          <form onSubmit={handleSendEmail}>
            <input
              type="email"
              placeholder="Seu e-mail cadastrado"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ padding: '8px', marginBottom: '10px', width: '250px' }}
            />
            <br />
            <button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        </>
      ) : (
        <div style={{ color: 'green', marginBottom: '20px' }}>
          <p><strong>Sucesso!</strong> O link foi enviado para <b>{email}</b>.</p>
          <p>Acesse seu e-mail e clique no link para criar uma nova senha.</p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <Link to="/login">Voltar para o Login</Link>
      </div>
    </div>
  )
}

export default ForgotPassword