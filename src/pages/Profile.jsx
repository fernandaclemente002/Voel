import { useEffect, useState } from 'react'
import { supabase } from '../library/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Camera, Moon, Sun, Monitor, UserCircle, 
  Settings, LogOut, PlusCircle, Users, 
  ChevronRight, Bell, ArrowLeft, ShieldCheck
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'

function Profile() {
  const [linkedAccounts, setLinkedAccounts] = useState([])  
  const [user, setUser] = useState(null)
  const [view, setView] = useState('menu') 
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const [newName, setNewName] = useState('') 
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem('voel_accounts') || '[]')
    setLinkedAccounts(accounts)
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setNewName(user?.user_metadata?.full_name || '')
      setIsAnonymous(user?.user_metadata?.is_anonymous || false) 
    }
    getUserData()
  }, [])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName, is_anonymous: isAnonymous }
    })
    setLoading(false)
    if (error) alert(error.message)
    else {
      alert("Perfil atualizado com sucesso!")
      setView('menu')
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("As novas senhas não coincidem.")
      return
    }
    setLoading(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (loginError) {
      setLoading(false)
      alert("Senha atual incorreta.")
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })
    setLoading(false)
    if (updateError) alert(updateError.message)
    else {
      alert("Senha alterada com sucesso!")
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setView('menu')
    }
  }

  const handleLogout = async () => {
    if (window.confirm("Deseja encerrar sua sessão?")) {
      await supabase.auth.signOut()
      navigate('/login')
    }
  }

  const handleSwitchAccount = async (targetEmail) => {
    setLoading(true);
    
    // 1. Desloga do Supabase para limpar o cache da sessão
    await supabase.auth.signOut();
    
    // 2. Prepara a URL com o e-mail
    const destination = `/login?email=${encodeURIComponent(targetEmail)}`;
    
    // 3. O uso do window.location.href em vez do navigate força um "refresh"
    // Isso garante que o componente Login leia o estado inicial da URL sem erros
    window.location.href = destination;
  };

  const MenuRow = ({ icon: Icon, label, value, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors px-2">
      <div className="flex items-center space-x-4">
        <Icon size={18} strokeWidth={1.2} className="text-voel-charcoal" />
        <span className="text-xs uppercase tracking-[0.15em] text-voel-charcoal font-medium">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className="text-[10px] text-gray-400 uppercase italic">{value}</span>}
        <ChevronRight size={14} className="text-gray-300" />
      </div>
    </button>
  )

  return (
    <div className="min-h-screen bg-voel-beige flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-12 px-4 max-w-2xl mx-auto w-full">
        
        {/* --- VIEW: MENU PRINCIPAL --- */}
        {view === 'menu' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col items-center mb-10">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border border-voel-gold/20 shadow-sm overflow-hidden">
                   <span className="text-3xl font-serif text-voel-gold uppercase">
                    {newName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                   </span>
                </div>
                <div className="absolute bottom-0 right-0 bg-voel-charcoal p-2 rounded-full border-2 border-white text-white">
                  <Camera size={14} />
                </div>
              </div>
              <h1 className="mt-4 font-serif text-xl tracking-[0.2em] text-voel-charcoal uppercase text-center">
                {newName || user?.email?.split('@')[0]}
              </h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-1 italic font-medium text-center">
                {isAnonymous ? 'Modo Privado Ativo' : user?.email}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Preferências</h3>
              <MenuRow icon={Monitor} label="Tema" value="Sistema" onClick={() => {}} />
              <MenuRow icon={Bell} label="Notificações" value="Ativadas" onClick={() => {}} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Configurações</h3>
              <MenuRow icon={UserCircle} label="Dados Pessoais" value="Editar" onClick={() => setView('dados')} />
              <MenuRow icon={Settings} label="Segurança" value="Senha" onClick={() => setView('seguranca')} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Contas</h3>
              <MenuRow icon={Users} label="Trocar de Conta" onClick={() => setView('contas')} />
              <MenuRow icon={PlusCircle} label="Adicionar Conta" onClick={() => navigate('/login')} />
            </div>

            <button onClick={handleLogout} className="w-full py-4 text-[11px] font-bold text-red-800 uppercase tracking-[0.3em] hover:bg-red-50 rounded-2xl transition-colors">
              Encerrar Sessão
            </button>
          </div>
        )}

        {/* --- VIEW: EDITAR DADOS --- */}
        {view === 'dados' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => setView('menu')} className="text-[10px] text-gray-400 uppercase tracking-widest mb-8 flex items-center hover:text-voel-gold transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Voltar ao menu
            </button>
            <h2 className="font-serif text-xl tracking-[0.2em] uppercase mb-8">Dados Pessoais</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">Nome Completo</label>
                <input type="text" className="w-full border-b border-voel-gold/30 py-3 focus:outline-none focus:border-voel-gold bg-transparent text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="flex items-start space-x-3 pt-2">
                <input id="anonymous" type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 mt-1 border-gray-300 rounded text-voel-gold" />
                <label htmlFor="anonymous" className="text-[10px] uppercase tracking-widest text-voel-charcoal leading-relaxed cursor-pointer">
                  Ativar Modo Privado <br/>
                  <span className="text-[8px] text-gray-400 normal-case italic font-normal">* Seu nome será ocultado para outros usuários.</span>
                </label>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-voel-charcoal text-white py-4 rounded-full text-[10px] font-bold tracking-[0.2em] hover:bg-voel-gold transition-all">
                {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: SEGURANÇA --- */}
        {view === 'seguranca' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => setView('menu')} className="text-[10px] text-gray-400 uppercase tracking-widest mb-8 flex items-center hover:text-voel-gold transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Voltar ao menu
            </button>
            <div className="flex items-center space-x-3 mb-8 text-voel-charcoal">
              <ShieldCheck size={20} className="text-voel-gold" />
              <h2 className="font-serif text-xl tracking-[0.2em] uppercase">Segurança</h2>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">Senha Atual</label>
                <input type="password" required className="w-full border-b border-voel-gold/30 py-3 focus:outline-none focus:border-voel-gold bg-transparent text-sm" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="pt-4 border-t border-gray-50">
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">Nova Senha</label>
                <input type="password" required className="w-full border-b border-voel-gold/30 py-3 focus:outline-none focus:border-voel-gold bg-transparent text-sm" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">Confirmar Nova Senha</label>
                <input type="password" required className="w-full border-b border-voel-gold/30 py-3 focus:outline-none focus:border-voel-gold bg-transparent text-sm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-voel-charcoal text-white py-4 rounded-full text-[10px] font-bold tracking-[0.2em] hover:bg-voel-gold transition-all">
                {loading ? 'PROCESSANDO...' : 'ATUALIZAR SENHA'}
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: TROCAR DE CONTA --- */}
        {view === 'contas' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => setView('menu')} className="text-[10px] text-gray-400 uppercase tracking-widest mb-8 flex items-center hover:text-voel-gold transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Voltar
            </button>
            
            <h2 className="font-serif text-xl tracking-[0.2em] uppercase mb-8">Suas Contas</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-voel-gold bg-voel-gold/5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-voel-gold/20 text-voel-gold font-serif">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-voel-charcoal uppercase">{newName || 'Usuário Atual'}</p>
                    <p className="text-[10px] text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <span className="text-[8px] bg-voel-gold text-white px-2 py-1 rounded-full uppercase tracking-tighter font-bold">Ativa</span>
              </div>

              {linkedAccounts.filter(acc => acc.email !== user?.email).map((acc, index) => (
                <button 
                  key={index} 
                  onClick={() => handleSwitchAccount(acc.email)} // CORREÇÃO: Dentro da tag do botão!
                  className="w-full flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-serif group-hover:bg-voel-gold group-hover:text-white transition-colors">
                      {acc.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-voel-charcoal uppercase">{acc.name}</p>
                      <p className="text-[10px] text-gray-400">{acc.email}</p>
                    </div>
                  </div>
                </button>
              ))}

              <button 
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 hover:border-voel-gold hover:text-voel-gold transition-all"
              >
                <PlusCircle size={18} />
                <span className="text-xs uppercase tracking-widest font-medium">Adicionar nova conta</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Profile