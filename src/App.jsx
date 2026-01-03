import { Navigate } from 'react-router-dom';

<Routes>
  <Route path="/" element={<Navigate to="/login" />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/reset-password" element={<ResetPassword />} />
</Routes>
