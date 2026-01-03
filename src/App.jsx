import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Rota Raiz: Se o usuário acessar apenas o domínio, 
           ele será levado para a página de login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* 2. Rota de Login */}
        <Route path="/login" element={<Login />} />

        {/* 3. Rota de Cadastro */}
        <Route path="/register" element={<Register />} />

        {/* 4. Rota de Redefinição de Senha */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 5. Rota de "Página não encontrada" (Opcional)
           Se o usuário digitar qualquer outra coisa, volta para o login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App