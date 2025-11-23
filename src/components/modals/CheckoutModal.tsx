import { useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { ordersAPI } from '../../lib/api'
import Modal from '../ui/Modal'

export function CheckoutModal() {
  const { currentModal, openModal, closeModal } = useModalStore()
  const { items, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { getCurrentLocation, loading: geoLoading } = useGeolocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)

  // Récupérer l'adresse de livraison depuis localStorage si disponible
  const getDeliveryAddress = (): string => {
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const address = JSON.parse(savedAddress)
        return address.fullAddress || '1234 Address Blvd'
      } catch (e) {
        return '1234 Address Blvd'
      }
    }
    return '1234 Address Blvd'
  }

  const [address, setAddress] = useState(getDeliveryAddress())

  // Fonction pour détecter la position et mettre à jour l'adresse
  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    setError(null)
    try {
      const addressData = await getCurrentLocation()
      setAddress(addressData.fullAddress || '')
      localStorage.setItem('faata_deliveryAddress', JSON.stringify(addressData))
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

      const orderData: any = {
        items: orderItems,
        orderType: 'livraison',
        customerInfo: {
          name: user?.name || '',
          phone: user?.phone || '',
          email: user?.email || '',
        },
      }

      if (address) {
        const savedAddress = localStorage.getItem('faata_deliveryAddress')
        if (savedAddress) {
          try {
            const addressData = JSON.parse(savedAddress)
            orderData.deliveryAddress = {
              fullAddress: address,
              street: addressData.street,
              city: addressData.city,
              zipCode: addressData.zipCode,
              coordinates: addressData.coordinates,
            }
          } catch (e) {
            orderData.deliveryAddress = {
              fullAddress: address,
            }
          }
        } else {
          orderData.deliveryAddress = {
            fullAddress: address,
          }
        }
      }

      const order = await ordersAPI.create(orderData)

      const orderId = (order._id || order.id)?.toString()
      if (orderId) {
        useModalStore.getState().setSelectedOrder(orderId)
      }

      localStorage.removeItem('faata_deliveryAddress')

      clearCart()
      closeModal()
      openModal('confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  const total = getTotal()

  return (
    <Modal isOpen={currentModal === 'checkout'} onClose={closeModal} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header avec retour */}
        <div className="flex items-center gap-3 mb-4 -mt-2">
          <button
            type="button"
            onClick={() => openModal('cart')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
        </div>

        {/* Adresse de livraison uniquement */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="Adresse de livraison"
            className="flex-1 text-sm text-gray-700 border-0 focus:outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingLocation || geoLoading}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Bouton Place Order */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
          >
            {loading ? 'Traitement...' : `Passer la commande • ${total.toLocaleString('fr-FR')} CFA`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
