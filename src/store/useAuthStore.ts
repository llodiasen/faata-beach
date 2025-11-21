import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../lib/api'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  address?: {
    street?: string
    city?: string
    zipCode?: string
  }
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>
  logout: () => void
  loadProfile: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.login({ email, password })
          localStorage.setItem('faata_token', response.token)
          set({ user: response.user, token: response.token, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.register(data)
          localStorage.setItem('faata_token', response.token)
          set({ user: response.user, token: response.token, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('faata_token')
        set({ user: null, token: null })
      },

      loadProfile: async () => {
        const token = localStorage.getItem('faata_token')
        if (!token) return

        try {
          const user = await authAPI.getProfile()
          set({ user, token })
        } catch (error) {
          localStorage.removeItem('faata_token')
          set({ user: null, token: null })
        }
      },
    }),
    {
      name: 'faata-auth-storage',
    }
  )
)

