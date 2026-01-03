import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home' 
import ProtectedRoute from './pages/ProtectedRoute' 
import Profile from './pages/Profile' 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial: manda para o login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* ROTAS PROTEGIDAS */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/favoritos" 
          element={
            <ProtectedRoute>
              {/* Exemplo simples até você criar a página de favoritos */}
              <div className="pt-32 text-center bg-voel-beige min-h-screen">
                <h1 className="font-serif text-2xl tracking-widest uppercase">Favoritos</h1>
                <p className="mt-4 italic">Sua lista de desejos em breve.</p>
              </div>
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rota de fallback: se digitar algo que não existe, volta pro login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App