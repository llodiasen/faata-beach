import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { LoginModal } from '../components/auth/LoginModal'
import { useModalStore } from '../store/useModalStore'
import { getUserRole } from '../lib/permissions'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openModal, currentModal } = useModalStore()

  useEffect(() => {
    if (user) {
      const userRole = getUserRole(user)
      if (userRole === 'admin') {
        navigate('/dashboard-admin')
      } else if (userRole === 'delivery') {
        navigate('/dashboard-livreur')
      } else {
        navigate('/profile')
      }
    } else {
      openModal('login')
    }
  }, [user, navigate, openModal])

  return (
    <div className="min-h-screen bg-gray-50">
      {currentModal === 'login' && (
        <LoginModal />
      )}
    </div>
  )
}

