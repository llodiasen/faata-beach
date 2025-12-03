import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalStore } from '../../store/useModalStore'
import { useAuthStore } from '../../store/useAuthStore'
import { ordersAPI } from '../../lib/api'
import Modal from '../ui/Modal'

interface OrderItem {
  name: string
  quantity: number
  price: number
  productId?: any
}

interface Order {
  _id: string
  status: string
  totalAmount: number
  customerInfo: { name: string; phone: string; email?: string }
  items: OrderItem[]
  orderType?: string
  deliveryAddress?: any
  createdAt: string
  assignedDeliveryId?: string
}

export function OrderDetailsModal() {
  const navigate = useNavigate()
  const modalStore = useModalStore()
  const { currentModal, closeModal, selectedOrder } = modalStore
  const { user } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!selectedOrder) {
        console.log('OrderDetailsModal: No selectedOrder')
        return
      }

      console.log('OrderDetailsModal: Fetching order', selectedOrder)

      try {
        setLoading(true)
        
        // Vérifier d'abord le cache (sessionStorage) pour un chargement instantané
        const lastOrderData = sessionStorage.getItem('faata_lastOrderData')
        if (lastOrderData) {
          try {
            const cachedOrder = JSON.parse(lastOrderData)
            if (cachedOrder._id === selectedOrder) {
              console.log('OrderDetailsModal: Using cached order')
              setOrder(cachedOrder)
              setError(null)
              setLoading(false)
              // Essayer de récupérer depuis l'API en arrière-plan pour avoir les données à jour
              ordersAPI.getById(selectedOrder).then(data => {
                console.log('OrderDetailsModal: Updated from API')
                setOrder(data)
                sessionStorage.setItem('faata_lastOrderData', JSON.stringify(data))
              }).catch((err) => {
                console.error('OrderDetailsModal: API update failed', err)
                // Ignorer l'erreur, on garde le cache
              })
              return
            }
          } catch (parseError) {
            console.error('Error parsing cached order:', parseError)
          }
        }
        
        // Sinon, récupérer depuis l'API
        console.log('OrderDetailsModal: Fetching from API')
        const data = await ordersAPI.getById(selectedOrder)
        setOrder(data)
        sessionStorage.setItem('faata_lastOrderData', JSON.stringify(data))
        setError(null)
      } catch (err) {
        console.error('OrderDetailsModal: Error fetching order', err)
        // Si l'API échoue, essayer d'utiliser le cache comme fallback
        const lastOrderData = sessionStorage.getItem('faata_lastOrderData')
        if (lastOrderData) {
          try {
            const cachedOrder = JSON.parse(lastOrderData)
            if (cachedOrder._id === selectedOrder) {
              console.log('OrderDetailsModal: Using cached order as fallback')
              setOrder(cachedOrder)
              setError(null)
              return
            }
          } catch (parseError) {
            console.error('Error parsing cached order as fallback:', parseError)
          }
        }
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (currentModal === 'orderDetails' && selectedOrder) {
      console.log('OrderDetailsModal: Modal is open, fetching order')
      fetchOrder()
    } else {
      console.log('OrderDetailsModal: Modal not open or no selectedOrder', { currentModal, selectedOrder })
    }
  }, [currentModal, selectedOrder])

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-800' },
      preparing: { bg: 'bg-purple-100', text: 'text-purple-800' },
      ready: { bg: 'bg-green-100', text: 'text-green-800' },
      assigned: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      on_the_way: { bg: 'bg-orange-100', text: 'text-orange-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    }
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      preparing: 'En préparation',
      ready: 'Prête',
      assigned: 'Assignée',
      on_the_way: 'En route',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    }
    return labels[status] || status
  }

  return (
    <Modal isOpen={currentModal === 'orderDetails'} onClose={closeModal} size="xl" noScroll={false} customHeader={true}>
      <div className="flex flex-col h-full">
        {/* Header personnalisé avec fond vert */}
        <div className="bg-[#39512a] text-white px-4 py-4 flex items-center gap-3 flex-shrink-0 z-30 rounded-t-lg">
          <button
            onClick={closeModal}
            className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
            aria-label="Retour"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold flex-1">Détails de commande</h2>
        </div>
        
        <div className="overflow-y-auto flex-1 bg-white">
          {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
          {error && <div className="text-red-600 text-center py-4">{error}</div>}
          {!loading && !error && order && (
            <div className="space-y-6 p-6">
          {/* Message de remerciement */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-1">Merci pour votre commande !</h3>
              <p className="text-sm text-green-700">
                Votre commande a été enregistrée avec succès. Nous vous contacterons bientôt pour confirmer.
              </p>
            </div>
          </div>

          {/* Informations commande */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Commande #{order._id.slice(-6)}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Informations client */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Informations client</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900"><strong>Nom:</strong> {order.customerInfo?.name || 'Non renseigné'}</p>
              <p className="text-sm text-gray-900"><strong>Téléphone:</strong> {order.customerInfo?.phone || 'Non renseigné'}</p>
              {order.customerInfo?.email && (
                <p className="text-sm text-gray-900"><strong>Email:</strong> {order.customerInfo.email}</p>
              )}
            </div>
          </div>

          {/* Type de commande */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Type de commande</h4>
            <p className="text-sm text-gray-600">
              {order.orderType === 'sur_place' ? 'Sur place' : order.orderType === 'emporter' ? 'À emporter' : order.orderType === 'livraison' ? 'Livraison' : order.orderType || 'Non spécifié'}
            </p>
            {order.deliveryAddress && (
              <div className="mt-2 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900"><strong>Adresse de livraison:</strong></p>
                <p className="text-sm text-gray-600">
                  {typeof order.deliveryAddress === 'string' 
                    ? order.deliveryAddress 
                    : order.deliveryAddress.fullAddress || JSON.stringify(order.deliveryAddress)}
                </p>
              </div>
            )}
          </div>

          {/* Articles */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Articles</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-[#39512a]">
                {order.totalAmount.toLocaleString('fr-FR')} CFA
              </span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {/* Bouton Suivre ma commande */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('OrderDetailsModal: Suivre ma commande clicked', { user, selectedOrder, currentModal })
                
                if (user) {
                  // Si connecté, fermer le modal et rediriger vers la page de suivi
                  console.log('OrderDetailsModal: User is logged in, navigating to order page')
                  closeModal()
                  setTimeout(() => {
                    navigate(`/order/${selectedOrder}`)
                  }, 200)
                } else {
                  // Si non connecté, ouvrir directement le modal de connexion
                  console.log('OrderDetailsModal: User not logged in, opening login modal')
                  // Ouvrir le modal de connexion immédiatement (il remplacera le modal actuel)
                  // Utiliser setTimeout pour s'assurer que l'état React est à jour
                  setTimeout(() => {
                    const store = useModalStore.getState()
                    console.log('OrderDetailsModal: Before opening login, currentModal:', store.currentModal)
                    store.openModal('login')
                    console.log('OrderDetailsModal: After opening login, currentModal:', store.currentModal)
                    // Vérifier après un court délai
                    setTimeout(() => {
                      console.log('OrderDetailsModal: Final check, currentModal:', useModalStore.getState().currentModal)
                    }, 100)
                  }, 0)
                }
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Suivre ma commande
            </button>
            
            {/* Bouton retour au menu */}
            <button
              onClick={closeModal}
              className="w-full bg-[#39512a] hover:bg-[#2d3f20] text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Retour au menu
            </button>
          </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

