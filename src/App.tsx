import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { getUserRole } from './lib/permissions'

// Pages
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import DeliveryDashboard from './pages/DeliveryDashboard'
import ProductPage from './pages/ProductPage'
import FavouritesPage from './pages/FavouritesPage'

// Protected Route Component
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: JSX.Element
  allowedRoles: string[]
}) {
  const { user } = useAuthStore()
  const userRole = getUserRole(user)
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  const { loadProfile } = useAuthStore()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/favourites" element={<FavouritesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Routes protégées - Client */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Routes protégées - Admin */}
        <Route
          path="/dashboard-admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Routes protégées - Livreur */}
        <Route
          path="/dashboard-livreur"
          element={
            <ProtectedRoute allowedRoles={['delivery']}>
              <DeliveryDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

