import { useState, useEffect } from 'react'
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
  const [orderType, setOrderType] = useState<'sur_place' | 'emporter' | 'livraison'>(
    (localStorage.getItem('faata_orderType') as any) || 'sur_place'
  )
  const [couponCode, setCouponCode] = useState('')

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

  // Adresse par défaut pour pickup
  const pickupAddress = "1234 Broadway st., Chicago, IL 13475, United States"

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    tableNumber: localStorage.getItem('faata_tableNumber') || '',
    address: getDeliveryAddress(),
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
    localStorage.setItem('faata_orderType', orderType)
  }, [orderType])

  // Fonction pour détecter la position et mettre à jour l'adresse
  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    setError(null)
    try {
      const address = await getCurrentLocation()
      setFormData(prev => ({ ...prev, address: address.fullAddress || '' }))
      localStorage.setItem('faata_deliveryAddress', JSON.stringify(address))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la détection de la position')
    } finally {
      setDetectingLocation(false)
    }
  }

  // Obtenir l'heure actuelle formatée
  const getCurrentTime = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return `${displayHours}:${displayMinutes} ${ampm}`
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
        orderType: orderType === 'sur_place' ? 'sur_place' : orderType === 'emporter' ? 'emporter' : 'livraison',
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
      }

      if (orderType === 'sur_place' && formData.tableNumber) {
        orderData.tableNumber = formData.tableNumber
      }

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

      const order = await ordersAPI.create(orderData)

      const orderId = (order._id || order.id)?.toString()
      if (orderId) {
        useModalStore.getState().setSelectedOrder(orderId)
      }

      if (orderType === 'livraison') {
        localStorage.removeItem('faata_deliveryAddress')
      }

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

        {/* Sélection Pickup/Delivery */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType('sur_place')}
              className={`p-4 rounded-xl border-2 transition-all ${
                orderType === 'sur_place'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-left">
                <div className={`font-semibold mb-1 ${orderType === 'sur_place' ? 'text-orange-500' : 'text-gray-900'}`}>
                  Sur place
                </div>
                <div className="text-xs text-gray-600">15 minutes</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('livraison')}
              className={`p-4 rounded-xl border-2 transition-all ${
                orderType === 'livraison'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-left">
                <div className={`font-semibold mb-1 ${orderType === 'livraison' ? 'text-orange-500' : 'text-gray-900'}`}>
                  Livraison
                </div>
                <div className="text-xs text-gray-600">20-30 minutes</div>
              </div>
            </button>
          </div>
        </div>

        {/* Pickup Address / Delivery Address */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                {orderType === 'sur_place' ? 'Adresse de retrait' : 'Adresse de livraison'}
              </div>
              {orderType === 'sur_place' ? (
                <div className="text-sm text-gray-600">{pickupAddress}</div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="Votre adresse complète"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation || geoLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-orange-500 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
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
              )}
            </div>
          </div>
        </div>

        {/* Pickup Time */}
        {orderType === 'sur_place' && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 mb-1">Heure de retrait</div>
                  <div className="text-sm text-gray-600">{getCurrentTime()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Details */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Détails de contact</h3>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Nom complet *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="Numéro de téléphone *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Email *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Add Coupon */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter un coupon</h3>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Insérer votre code coupon"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
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
