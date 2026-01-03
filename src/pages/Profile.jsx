import { useEffect, useState } from 'react'
import { supabase } from '../library/supabase'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

function Profile() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Pega os dados do usuário logado
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUserData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-voel-beige flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 px-4 flex flex-col items-center">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-voel-beige rounded-full flex items-center justify-center mx-auto mb-6 border border-voel-gold/20">
            <span className="text-2xl font-serif text-voel-gold uppercase">
              {user?.email?.charAt(0) || 'V'}
            </span>
          </div>

          <h2 className="text-xl font-serif tracking-widest text-voel-charcoal uppercase">
            Minha Conta
          </h2>
          
          <div className="mt-8 space-y-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">E-mail cadastrado</p>
            <p className="text-voel-charcoal font-sans">{user?.email}</p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="text-[11px] font-bold text-red-800 hover:text-voel-charcoal transition-colors uppercase tracking-[0.2em]"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile