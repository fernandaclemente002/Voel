import { useEffect, useState } from 'react'
import { supabase } from '../library/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Camera, Monitor, UserCircle, 
  Settings, PlusCircle, Users, 
  ChevronRight, Bell, ArrowLeft, ShieldCheck, Mail, Lock
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'

function Profile() {
  const [linkedAccounts, setLinkedAccounts] = useState([])  
  const [user, setUser] = useState(null)
  const [view, setView] = useState('menu') 
  const [subView, setSubView] = useState('senha') 
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const [newName, setNewName] = useState('') 
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem('voel_accounts') || '[]')
    setLinkedAccounts(accounts)

    // Função para buscar dados
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setNewName(user.user_metadata?.full_name || '')
        setIsAnonymous(user.user_metadata?.is_anonymous || false)
      }
    }

    getUserData()

    // ESCUTADOR DE SESSÃO: Isso detecta se o e-mail mudou enquanto a página estava aberta
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        setUser(session?.user || null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUpdateProfile = async (e) => {
  e.preventDefault()
  setLoading(true)
  const { error } = await supabase.auth.updateUser({
    data: { full_name: newName, is_anonymous: isAnonymous }
  })
  
  if (!error) {
    // ATUALIZA O LOCALSTORAGE TAMBÉM
    const accounts = JSON.parse(localStorage.getItem('voel_accounts') || '[]')
    const updated = accounts.map(acc => 
      acc.id === user.id ? { ...acc, name: newName } : acc
    )
    localStorage.setItem('voel_accounts', JSON.stringify(updated))
    setLinkedAccounts(updated) // Atualiza o estado da tela
    
    alert("Perfil atualizado com sucesso!")
    setView('menu')
  } else {
    alert(error.message)
  }
  setLoading(false)
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
// NOVA FUNÇÃO: Atualizar E-mail
 const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      alert(
        "SOLICITAÇÃO DE SEGURANÇA VÖEL:\n\n" +
        "1. Verifique seu e-mail ATUAL para autorizar a saída.\n" +
        "2. Verifique seu NOVO e-mail para confirmar a alteração.\n\n" +
        "A troca só será concluída após clicar nos DOIS links. Por segurança, você será deslogado agora."
      )
      
      // LOGOUT FORÇADO: Isso limpa qualquer rastro da sessão antiga
      // e evita que o app tente renderizar dados de um e-mail que não existe mais.
      await supabase.auth.signOut()
      navigate('/login')
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
    await supabase.auth.signOut();
    const destination = `/login?email=${encodeURIComponent(targetEmail)}`;
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
  // Se ainda estiver carregando o usuário, mostra um estado de loading elegante
  if (!user && view === 'menu') {
    return (
      <div className="min-h-screen bg-voel-beige flex items-center justify-center">
        <div className="animate-pulse font-serif text-voel-gold tracking-widest uppercase text-xs">
          Carregando Perfil...
        </div>
      </div>
    )
  }
  
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
                  // Localize o span dentro da View 'menu'
                <span className="text-3xl font-serif text-voel-gold uppercase">
                  {newName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'V'}
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
              <MenuRow icon={Settings} label="Segurança" value="Senha/E-mail" onClick={() => setView('seguranca')} />
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

        {/* --- VIEW: SEGURANÇA (CORRIGIDA) --- */}
        {view === 'seguranca' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden">
            <button onClick={() => setView('menu')} className="text-[10px] text-gray-400 uppercase tracking-widest mb-8 flex items-center hover:text-voel-gold transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Voltar ao menu
            </button>
            
            <div className="flex justify-center items-center space-x-8 mb-10">
              <button onClick={() => setSubView('senha')} className={`flex flex-col items-center transition-all duration-300 ${subView === 'senha' ? 'text-voel-gold scale-110' : 'text-gray-300'}`}>
                <Lock size={18} className="mb-1" />
                <span className="text-[9px] uppercase tracking-widest font-bold">Senha</span>
              </button>
              <div className="w-12 h-[1px] bg-gray-100"></div>
              <button onClick={() => setSubView('email')} className={`flex flex-col items-center transition-all duration-300 ${subView === 'email' ? 'text-voel-gold scale-110' : 'text-gray-300'}`}>
                <Mail size={18} className="mb-1" />
                <span className="text-[9px] uppercase tracking-widest font-bold">E-mail</span>
              </button>
            </div>

            <div className="relative overflow-hidden w-full">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ width: '200%', transform: subView === 'senha' ? 'translateX(0%)' : 'translateX(-50%)' }}>
                {/* LADO 1: SENHA */}
                <div className="w-1/2 px-2 flex-shrink-0">
                  <div className="flex items-center space-x-3 mb-6 text-voel-charcoal">
                    <ShieldCheck size={20} className="text-voel-gold" />
                    <h2 className="font-serif text-lg tracking-[0.2em] uppercase">Alterar Senha</h2>
                  </div>
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">Senha Atual</label>
                      <input type="password" required className="w-full border-b border-voel-gold/30 py-3 focus:outline-none focus:border-voel-gold bg-transparent text-sm" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div>
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

                {/* LADO 2: E-MAIL */}
                <div className="w-1/2 px-2 flex-shrink-0">
                  <div className="flex items-center space-x-3 mb-6 text-voel-charcoal">
                    <Mail size={20} className="text-voel-gold" />
                    <h2 className="font-serif text-lg tracking-[0.2em] uppercase">Alterar E-mail</h2>
                  </div>
                  <form onSubmit={handleUpdateEmail} className="space-y-6">
                    <div className="bg-voel-beige/30 p-4 rounded-xl mb-4 border border-voel-gold/10">
                      <p className="text-[10px] text-gray-500 italic leading-relaxed">
                        Por segurança, enviaremos links de confirmação para o e-mail atual e para o novo endereço.
                      </p>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">E-mail Atual</label>
                     <input 
                      type="text" 
                      disabled 
                      className="w-full border-b border-gray-100 py-3 bg-transparent text-sm text-gray-400 opacity-60 cursor-not-allowed font-light italic" 
                      value={user?.email} 
                    />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">Novo E-mail</label>
                      <input type="email" required className="w-full border-b border-voel-gold/30 py-3 focus:outline-none focus:border-voel-gold bg-transparent text-sm" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="exemplo@voel.com" />
                    </div>
                    <button disabled={loading} type="submit" className="w-full bg-voel-charcoal text-white py-4 rounded-full text-[10px] font-bold tracking-[0.2em] hover:bg-voel-gold transition-all mt-4">
                      {loading ? 'PROCESSANDO...' : 'ATUALIZAR E-MAIL'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
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
                    {newName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'V'}
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
                  onClick={() => handleSwitchAccount(acc.email)}
                  className="w-full flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-serif group-hover:bg-voel-gold group-hover:text-white transition-colors">
                      {acc.name?.charAt(0) || acc.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-voel-charcoal uppercase">{acc.name}</p>
                      <p className="text-[10px] text-gray-400">{acc.email}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button onClick={() => navigate('/login')} className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 hover:border-voel-gold hover:text-voel-gold transition-all">
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