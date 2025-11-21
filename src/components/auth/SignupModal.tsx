import { useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useAuthStore } from '../../store/useAuthStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export function SignupModal() {
  const { currentModal, closeModal, openModal } = useModalStore()
  const { register, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      })
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    }
  }

  return (
    <Modal isOpen={currentModal === 'signup'} onClose={closeModal} title="S'inscrire" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Nom</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
          />
        </div>

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
          <label className="block text-gray-700 font-semibold mb-2">Téléphone (optionnel)</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
          />
          <p className="text-gray-500 text-xs mt-1">Au moins 6 caractères</p>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-4">
          <Button variant="outline" onClick={closeModal} type="button" className="flex-1">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </Button>
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              closeModal()
              openModal('login')
            }}
            className="text-faata-red hover:underline text-sm"
          >
            Déjà un compte ? Se connecter
          </button>
        </div>
      </form>
    </Modal>
  )
}

