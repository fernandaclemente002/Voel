import Login from './pages/Login'
import Register from './pages/Register'
import { useSession } from './hooks/useSession'
import { supabase } from './library/supabase'

function App() {
  const { session, loading } = useSession()

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div>
      <h1>VOEL</h1>

      {!session ? (
        <>
          <Login />
          <Register />
        </>
      ) : (
        <><p>Usuário logado: {session.user.email}</p><button onClick={() => supabase.auth.signOut()}>
            Sair
          </button></>
       
      )}
    </div>
  )
}

export default App
