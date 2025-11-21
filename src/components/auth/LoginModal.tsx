import { useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useAuthStore } from '../../store/useAuthStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export function LoginModal() {
  const { currentModal, closeModal, openModal } = useModalStore()
  const { login, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await login(formData.email, formData.password)
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    }
  }

  return (
    <Modal isOpen={currentModal === 'login'} onClose={closeModal} title="Se connecter" size="sm" noScroll>
      <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-1.5 text-sm md:text-base">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="votre@email.com"
            className="w-full px-4 py-2.5 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red text-base md:text-sm"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1.5 text-sm md:text-base">Mot de passe</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="••••••••"
            className="w-full px-4 py-2.5 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red text-base md:text-sm"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm md:text-xs bg-red-50 border border-red-200 rounded-lg p-2.5">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 pt-1">
          <Button 
            variant="outline" 
            onClick={closeModal} 
            type="button" 
            className="flex-1 w-full sm:w-auto py-2.5 md:py-2 text-base md:text-sm font-medium"
          >
            Annuler
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading} 
            className="flex-1 w-full sm:w-auto py-2.5 md:py-2 text-base md:text-sm font-semibold"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </div>

        <div className="text-center mt-3 md:mt-4 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              closeModal()
              openModal('signup')
            }}
            className="text-faata-red hover:underline text-sm md:text-xs font-medium"
          >
            Pas encore de compte ? <span className="font-semibold">S'inscrire</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}

