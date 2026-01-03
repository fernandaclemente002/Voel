import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../library/supabase'
//cod pra proteger rotas (home)
//Existem duas formas de exportar um componente em React, e ambas funcionam:
//Export Default na frente da função (Como eu fiz)
//Eu coloquei o export default diretamente na linha onde a função é criada:
export default function ProtectedRoute({ children }) { // O "export default" já está aqui!
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica a sessão atual logo que o componente carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Escuta mudanças (caso o usuário deslogue em outra aba)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Carregando...</div> // Pode ser um spinner de carregamento
  }

  // Se não tiver sessão, manda para o login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Se tiver sessão, mostra a página (children)
  return children
}