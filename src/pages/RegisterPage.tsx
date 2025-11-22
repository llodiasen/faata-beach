import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { SignupModal } from '../components/auth/SignupModal'
import { useModalStore } from '../store/useModalStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openModal, currentModal } = useModalStore()

  useEffect(() => {
    if (user) {
      navigate('/')
    } else {
      openModal('signup')
    }
  }, [user, navigate, openModal])

  return (
    <div className="min-h-screen bg-gray-50">
      {currentModal === 'signup' && (
        <SignupModal />
      )}
    </div>
  )
}

