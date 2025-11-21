import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export const useAuth = () => {
  const { user, token, loadProfile } = useAuthStore()

  useEffect(() => {
    if (!user && token) {
      loadProfile()
    }
  }, [user, token, loadProfile])

  return {
    user,
    isAuthenticated: !!user,
    token,
  }
}

