import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { ordersAPI } from '../../lib/api'

interface OrderItem {
  productId: {
    _id?: string
    name?: string
    imageUrl?: string
  } | string
  name: string
  quantity: number
  price: number
}

interface Order {
  _id: string
  items: OrderItem[]
  totalAmount: number
  orderType: 'sur_place' | 'emporter' | 'livraison'
  createdAt: string
  status: string
}

export function ConfirmationModal() {
  const { currentModal, closeModal, openModal, selectedOrder } = useModalStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!selectedOrder) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await ordersAPI.getById(selectedOrder)
        setOrder(data)
      } catch (err) {
        console.error('Error fetching order:', err)
      } finally {
        setLoading(false)
      }
    }

    if (currentModal === 'confirmation' && selectedOrder) {
      fetchOrder()
    }
  }, [currentModal, selectedOrder])

  const handleTrackOrder = () => {
    if (selectedOrder) {
      openModal('orderTracking')
    }
  }

  const handleContinueShopping = () => {
    closeModal()
    openModal('categories')
  }

  // Miniatures des produits commandés
  const orderItems = order?.items || []
  const visibleThumbnails = orderItems.slice(0, 5)
  const remainingCount = orderItems.length - 5

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return 'Today'
    } else {
      return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    }
  }

  // Heure estimée de livraison
  const estimatedTime = () => {
    const now = new Date()
    const deliveryTime = new Date(now.getTime() + 60 * 60 * 1000) // +1h
    const nextHour = new Date(now.getTime() + 2 * 60 * 60 * 1000) // +2h
    
    return {
      start: deliveryTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
      end: nextHour.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
    }
  }

  const timeRange = estimatedTime()

  if (currentModal !== 'confirmation') return null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 h-screen z-50 bg-yellow-50 flex flex-col overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : (
          <div className="flex-1 px-4 py-6">
            {/* Carte blanche principale */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              {/* Section de confirmation en haut */}
              <div className="px-6 pt-8 pb-6 text-center">
                {/* Icône de confirmation */}
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Titre */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Order placed</h1>

                {/* Message de confirmation */}
                <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                  Your order has been sent to "FAATA Beach" where a member of staff will assemble your groceries and prepare them for delivery.
                </p>

                {/* Section Important */}
                <div className="bg-gray-100 rounded-xl p-4 text-left">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Important</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    In some cases, the store may require your input regarding some of the items in your list. When this happens, you will be alerted via push notifications (if enabled), and your order status will change accordingly.
                  </p>
                </div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-200"></div>

              {/* Carte de résumé de commande */}
              <div className="p-6">
                {/* Header avec nom du restaurant et total */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-gray-900">FAATA Beach</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {order?.totalAmount ? `${order.totalAmount.toLocaleString('fr-FR')} CFA` : '0 CFA'}
                  </span>
                </div>

                {/* Heure et rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {order?.createdAt ? formatDate(order.createdAt) : 'Today'} / {timeRange.start} - {timeRange.end}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">4.8</span>
                  </div>
                </div>

                {/* Miniatures des produits */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex -space-x-2">
                    {visibleThumbnails.map((item, index) => {
                      const imageUrl = typeof item.productId === 'object' 
                        ? item.productId?.imageUrl 
                        : undefined
                      const name = item.name || (typeof item.productId === 'object' ? item.productId?.name : '')
                      
                      return (
                        <div
                          key={index}
                          className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                          style={{ zIndex: visibleThumbnails.length - index }}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {remainingCount > 0 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs">
                        +{remainingCount}
                      </div>
                    )}
                  </div>

                  {/* Bouton Order details */}
                  <button
                    onClick={() => setShowOrderDetails(!showOrderDetails)}
                    className="px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl text-sm font-medium text-gray-900 flex items-center gap-2 transition-colors"
                  >
                    Order details
                    <svg
                      className={`w-4 h-4 transition-transform ${showOrderDetails ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Détails de commande expandables */}
                {showOrderDetails && order && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      {order.items.map((item, index) => {
                        const imageUrl = typeof item.productId === 'object' 
                          ? item.productId?.imageUrl 
                          : undefined
                        const productName = item.name || (typeof item.productId === 'object' ? item.productId?.name : 'Produit')
                        
                        return (
                          <div key={index} className="flex items-center gap-3">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={productName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{productName}</p>
                              <p className="text-xs text-gray-600">Qté: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action en bas */}
        <div className="px-4 pb-6 space-y-3">
          <button
            onClick={handleTrackOrder}
            className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-900 transition-colors"
          >
            Check order status
          </button>
          <button
            onClick={handleContinueShopping}
            className="w-full bg-white text-black border-2 border-gray-300 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Continue shopping
          </button>
        </div>
      </div>
  )
}
