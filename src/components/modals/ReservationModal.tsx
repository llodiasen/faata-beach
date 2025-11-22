import { useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useAuthStore } from '../../store/useAuthStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export function ReservationModal() {
  const { currentModal, closeModal } = useModalStore()
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    date: '',
    time: '',
    numberOfGuests: 1,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Créer API endpoint pour créer réservation
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('faata_token') || ''}`
        },
        body: JSON.stringify({
          customerInfo: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
          },
          date: formData.date,
          time: formData.time,
          numberOfGuests: formData.numberOfGuests,
          notes: formData.notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la création de la réservation' }))
        throw new Error(errorData.message || 'Erreur lors de la création de la réservation')
      }

      setSuccess(true)
      setTimeout(() => {
        closeModal()
        setSuccess(false)
        setFormData({
          name: user?.name || '',
          phone: user?.phone || '',
          email: user?.email || '',
          date: '',
          time: '',
          numberOfGuests: 1,
          notes: '',
        })
      }, 2000)
    } catch (err) {
      console.error('Erreur réservation:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la réservation')
    } finally {
      setLoading(false)
    }
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <Modal isOpen={currentModal === 'reservation'} onClose={closeModal} title="Réserver une table" size="md">
      {success ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">Réservation créée !</p>
          <p className="text-gray-600">Votre demande de réservation a été enregistrée</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nom complet *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Téléphone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                min={minDate}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Heure *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nombre de personnes *</label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={formData.numberOfGuests}
              onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Notes (optionnel)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
              rows={3}
              placeholder="Allergies, préférences particulières..."
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={closeModal} type="button">
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Réservation...' : 'Réserver'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

