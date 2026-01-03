import { useState } from 'react'
import { supabase } from '../library/supabase'
import { useNavigate, Link } from 'react-router-dom' // Adicione Link e useNavigate

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate() // Inicialize aqui

  // ... mantenha sua função isStrongPassword ...

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
      alert('Cadastro feito! Verifique seu e-mail para confirmar a conta.')
      navigate('/login') // Manda para o login após cadastrar
    }
  }

  return (
    <div>
      <h2>Criar conta</h2>
      <form onSubmit={handleRegister}>
        {/* ... seus inputs ... */}
        <button type="submit">Cadastrar</button>
      </form>

      {/* Adicione um link para voltar se ele já tiver conta */}
      <p>
        Já tem uma conta? <Link to="/login">Faça login</Link>
      </p>
    </div>
  )
}

export default Register