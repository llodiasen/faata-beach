import { useState, useEffect } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { ordersAPI } from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export function CheckoutModal() {
  const { currentModal, closeModal, openModal } = useModalStore()
  const { items, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { getCurrentLocation, loading: geoLoading, error: geoError } = useGeolocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)

  const orderType = (localStorage.getItem('faata_orderType') as 'sur_place' | 'emporter' | 'livraison') || 'sur_place'

  // Récupérer l'adresse de livraison depuis localStorage si disponible
  const getDeliveryAddress = (): string => {
    if (orderType === 'livraison') {
      const savedAddress = localStorage.getItem('faata_deliveryAddress')
      if (savedAddress) {
        try {
          const address = JSON.parse(savedAddress)
          return address.fullAddress || ''
        } catch (e) {
          console.error('Erreur lors de la lecture de l\'adresse:', e)
        }
      }
    }
    return ''
  }

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    tableNumber: localStorage.getItem('faata_tableNumber') || '',
    address: getDeliveryAddress(), // Adresse de livraison
  })

  // Mettre à jour l'adresse quand orderType change
  useEffect(() => {
    if (orderType === 'livraison') {
      const savedAddress = localStorage.getItem('faata_deliveryAddress')
      if (savedAddress) {
        try {
          const address = JSON.parse(savedAddress)
          setFormData(prev => ({ ...prev, address: address.fullAddress || '' }))
        } catch (e) {
          console.error('Erreur lors de la lecture de l\'adresse:', e)
        }
      }
    }
  }, [orderType])

  // Fonction pour détecter la position et mettre à jour l'adresse
  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    setError(null)
    try {
      const address = await getCurrentLocation()
      // Mettre à jour l'adresse dans le formulaire et localStorage
      setFormData(prev => ({ ...prev, address: address.fullAddress || '' }))
      localStorage.setItem('faata_deliveryAddress', JSON.stringify(address))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la détection de la position')
    } finally {
      setDetectingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))

      // Préparer les données de commande
      const orderData: any = {
        items: orderItems,
        orderType,
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
      }

      // Ajouter tableNumber pour sur_place
      if (orderType === 'sur_place' && formData.tableNumber) {
        orderData.tableNumber = formData.tableNumber
      }

      // Ajouter deliveryAddress pour livraison
      if (orderType === 'livraison' && formData.address) {
        const savedAddress = localStorage.getItem('faata_deliveryAddress')
        if (savedAddress) {
          try {
            const address = JSON.parse(savedAddress)
            orderData.deliveryAddress = {
              fullAddress: formData.address,
              street: address.street,
              city: address.city,
              zipCode: address.zipCode,
              coordinates: address.coordinates,
            }
          } catch (e) {
            // Si erreur de parsing, utiliser juste l'adresse complète
            orderData.deliveryAddress = {
              fullAddress: formData.address,
            }
          }
        } else {
          orderData.deliveryAddress = {
            fullAddress: formData.address,
          }
        }
      }

      await ordersAPI.create(orderData)

      // Nettoyer les données de livraison après succès
      if (orderType === 'livraison') {
        localStorage.removeItem('faata_deliveryAddress')
      }

      clearCart()
      openModal('confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={currentModal === 'checkout'} onClose={closeModal} title="Finaliser la commande" size="md">
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
          <label className="block text-gray-700 font-semibold mb-2">Téléphone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

        {orderType === 'sur_place' && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Numéro de table</label>
            <input
              type="text"
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red"
            />
          </div>
        )}

        {orderType === 'livraison' && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Adresse de livraison</label>
            <div className="relative">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="Votre adresse complète"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-faata-red text-sm"
              />
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation || geoLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-faata-red hover:bg-faata-red/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Détecter ma position"
              >
                {detectingLocation || geoLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1.5">
              Adresse détectée automatiquement. Vous pouvez la modifier si nécessaire.
            </p>
            {geoError && (
              <p className="text-sm text-red-600 mt-1.5">{geoError}</p>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-faata-red">{getTotal().toFixed(2)} €</span>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => openModal('cart')} type="button" className="flex-1">
            Retour
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="flex-1">
            {loading ? 'Traitement...' : 'Confirmer la commande'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

