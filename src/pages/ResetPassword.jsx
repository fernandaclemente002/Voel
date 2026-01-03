import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../library/supabase'

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Recuperação de senha ativa.");
      } else if (event === "SIGNED_OUT") {
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
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Senha redefinida com sucesso! Faça login agora.')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-voel-beige px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-serif font-light text-voel-charcoal tracking-[0.3em] uppercase">
            VÖEL
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-sans italic">
            Nova senha
          </p>
        </div>

        <form className="mt-8 space-y-5 flex flex-col items-center" onSubmit={handleReset}>
          <div className="space-y-4 w-full text-left">
            <input
              type="password"
              placeholder="Nova senha"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirme a nova senha"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-voel-gold/40 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:border-voel-gold sm:text-sm transition-all duration-300 bg-transparent"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
  type="submit"
  disabled={loading}
  className="animate-shine group relative w-full max-w-[250px] flex justify-center py-3.5 px-4 border border-transparent text-xs font-bold rounded-full text-white bg-voel-charcoal 
             /* No PC: */
             hover:bg-voel-gold 
             /* No Celular (Toque): */
             active:bg-voel-gold-dark active:scale-95 
             transition-all duration-300 shadow-lg disabled:opacity-50 tracking-[0.2em]"
>
            {loading ? 'REDEFININDO...' : 'REDEFINIR SENHA'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword