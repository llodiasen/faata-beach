import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { usersAPI, ordersAPI } from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface DeliveryUser {
  _id: string
  name: string
  phone?: string
}

export function AssignDeliveryModal() {
  const { currentModal, closeModal, selectedOrder } = useModalStore()
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentModal === 'assignDelivery') {
      loadDeliveryUsers()
    }
  }, [currentModal])

  const loadDeliveryUsers = async () => {
    try {
      setLoading(true)
      const data = await usersAPI.getDeliveryUsers()
      console.log('📦 Livreurs chargés:', data)
      setDeliveryUsers(data || [])
    } catch (error: any) {
      console.error('❌ Erreur chargement livreurs:', error)
      console.error('❌ Message:', error?.message)
      setDeliveryUsers([])
      // Afficher un message d'erreur plus détaillé
      if (error?.message) {
        alert(`Erreur lors du chargement des livreurs: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedOrder || !selectedDeliveryId) return

    setSaving(true)
    try {
      await ordersAPI.updateStatus(selectedOrder, 'assigned', selectedDeliveryId)
      closeModal()
      // Notifier le parent pour recharger les données
      window.dispatchEvent(new CustomEvent('orderUpdated'))
    } catch (error: any) {
      console.error('Erreur assignation:', error)
      alert(`Erreur lors de l'assignation du livreur: ${error?.message || 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={currentModal === 'assignDelivery'} onClose={closeModal} title="Assigner un livreur" size="md">
      {loading ? (
        <div className="text-center py-8">Chargement des livreurs...</div>
      ) : deliveryUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold mb-2">Aucun livreur disponible</p>
          <p className="text-sm text-gray-600 mb-4">
            Assurez-vous que des utilisateurs avec le rôle "delivery" existent dans la base de données.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Pour créer des livreurs, exécutez : <code className="bg-gray-100 px-2 py-1 rounded">npm run create-users</code>
          </p>
          <Button variant="outline" onClick={closeModal}>
            Fermer
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Sélectionner un livreur</label>
            <select
              value={selectedDeliveryId}
              onChange={(e) => setSelectedDeliveryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
            >
              <option value="">-- Choisir un livreur --</option>
              {deliveryUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} {user.phone && `- ${user.phone}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={closeModal} className="flex-1">
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAssign} 
              disabled={!selectedDeliveryId || saving}
              className="flex-1"
            >
              {saving ? 'Assignation...' : 'Assigner'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

