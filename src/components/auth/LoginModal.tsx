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
    <Modal isOpen={currentModal === 'login'} onClose={closeModal} title="Se connecter" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Mot de passe</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-4">
          <Button variant="outline" onClick={closeModal} type="button" className="flex-1">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              closeModal()
              openModal('signup')
            }}
            className="text-faata-red hover:underline text-sm"
          >
            Pas encore de compte ? S'inscrire
          </button>
        </div>
      </form>
    </Modal>
  )
}

