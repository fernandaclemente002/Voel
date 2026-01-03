import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home' 
import ProtectedRoute from './pages/ProtectedRoute' 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial: manda para o login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* ROTA PROTEGIDA: Envolve a Home */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
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