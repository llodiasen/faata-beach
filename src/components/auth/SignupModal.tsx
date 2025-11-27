import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalStore } from '../../store/useModalStore'
import { useAuthStore } from '../../store/useAuthStore'
import { getUserRole } from '../../lib/permissions'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export function SignupModal() {
  const navigate = useNavigate()
  const { currentModal, closeModal } = useModalStore()
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
      // Le user est mis à jour dans le store après register
      // On attend un peu pour que le store se mette à jour
      setTimeout(() => {
        const store = useAuthStore.getState()
        const userRole = getUserRole(store.user)
        if (userRole === 'admin') {
          navigate('/dashboard-admin')
        } else if (userRole === 'delivery') {
          navigate('/dashboard-livreur')
        } else {
          navigate('/profile')
        }
        closeModal()
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    }
  }

  const handleClose = () => {
    closeModal()
    navigate('/')
  }

  return (
    <Modal 
      isOpen={currentModal === 'signup'} 
      onClose={handleClose} 
      title="S'inscrire" 
      size="sm" 
      noScroll 
      transparentOverlay
      heroBackground="http://wasafrica.org/wp-content/uploads/2025/11/96444e8b6107fad5-scaled.webp"
    >
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-3.5">
        <div>
          <label className="block text-gray-700 font-semibold mb-1.5 text-sm md:text-base">Nom complet</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Votre nom"
            className="w-full px-4 py-2.5 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] text-base md:text-sm"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1.5 text-sm md:text-base">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="votre@email.com"
            className="w-full px-4 py-2.5 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] text-base md:text-sm"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1.5 text-sm md:text-base">
            Téléphone <span className="text-gray-500 font-normal text-xs">(optionnel)</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+689 XX XX XX XX"
            className="w-full px-4 py-2.5 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] text-base md:text-sm"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1.5 text-sm md:text-base">Mot de passe</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] text-base md:text-sm"
            autoComplete="new-password"
          />
          <p className="text-gray-500 text-xs mt-1">Au moins 6 caractères requis</p>
        </div>

        {error && (
          <div className="text-red-600 text-sm md:text-xs bg-red-50 border border-red-200 rounded-lg p-2.5">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 pt-1">
          <Button 
            variant="outline" 
            onClick={handleClose} 
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
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </Button>
        </div>

        <div className="text-center mt-3 md:mt-4 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              closeModal()
              navigate('/login')
            }}
            className="text-[#39512a] hover:underline text-sm md:text-xs font-medium"
          >
            Déjà un compte ? <span className="font-semibold">Se connecter</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}

