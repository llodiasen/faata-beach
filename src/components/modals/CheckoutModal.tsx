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

  // Récupérer le type de commande depuis localStorage
  const getOrderType = (): 'sur_place' | 'emporter' | 'livraison' => {
    const savedOrderType = localStorage.getItem('faata_orderType')
    return (savedOrderType as 'sur_place' | 'emporter' | 'livraison') || 'livraison'
  }

  const orderType = getOrderType()

  // Récupérer l'adresse de livraison depuis localStorage si disponible
  const getDeliveryAddress = (): string => {
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const address = JSON.parse(savedAddress)
        return address.fullAddress || ''
      } catch (e) {
        return ''
      }
    }
    return ''
  }

  const [address, setAddress] = useState(getDeliveryAddress())
  const [tableNumber, setTableNumber] = useState('')

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
        orderType: orderType,
        customerInfo: {
          name: user?.name || '',
          phone: user?.phone || '',
          email: user?.email || '',
        },
      }

      // Si sur place, ajouter le numéro de table
      if (orderType === 'sur_place') {
        if (!tableNumber.trim()) {
          setError('Veuillez indiquer le numéro de table')
          setLoading(false)
          return
        }
        orderData.tableNumber = tableNumber.trim()
      }

      // Si livraison, ajouter l'adresse de livraison
      if (orderType === 'livraison') {
        if (!address.trim()) {
          setError('Veuillez indiquer une adresse de livraison')
          setLoading(false)
          return
        }
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
      console.log('CheckoutModal: Order created', order)

      const orderId = (order._id || order.id)?.toString()
      console.log('CheckoutModal: Order ID', orderId)
      
      if (orderId) {
        useModalStore.getState().setSelectedOrder(orderId)
      }

      localStorage.removeItem('faata_deliveryAddress')
      localStorage.removeItem('faata_orderType')

      // Stocker l'ID de commande dans sessionStorage
      if (orderId && order) {
        sessionStorage.setItem('faata_lastOrderId', orderId)
        sessionStorage.setItem('faata_lastOrderData', JSON.stringify(order))
        console.log('CheckoutModal: Order saved to sessionStorage')
        
        // Vider le panier
        clearCart()
        console.log('CheckoutModal: Cart cleared')
        
        // Définir l'ID de commande sélectionnée et ouvrir le modal de détails
        const modalStore = useModalStore.getState()
        modalStore.setSelectedOrder(orderId)
        console.log('CheckoutModal: Selected order set to', orderId)
        
        // Fermer le modal checkout et ouvrir immédiatement le modal de détails
        // Utiliser une seule opération pour éviter les conflits
        closeModal()
        console.log('CheckoutModal: Checkout modal closed')
        
        // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
        requestAnimationFrame(() => {
        setTimeout(() => {
            console.log('CheckoutModal: Opening orderDetails modal')
            modalStore.openModal('orderDetails')
            console.log('CheckoutModal: OrderDetails modal opened, currentModal:', modalStore.currentModal, 'selectedOrder:', modalStore.selectedOrder)
        }, 150)
        })
      } else {
        console.error('CheckoutModal: No orderId or order')
        closeModal()
        setError('Erreur: Impossible de récupérer l\'ID de commande')
      }
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

        {/* Numéro de table pour sur place */}
        {orderType === 'sur_place' && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              Numéro de table *
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              placeholder="Ex: Table 5"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]/30 focus:border-[#39512a] text-sm transition-all bg-white text-gray-800 placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Adresse de livraison pour livraison */}
        {orderType === 'livraison' && (
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
        )}

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
