import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ordersAPI } from '../lib/api'
import { getProductImage } from '../lib/productImages'
import BottomNavigation from '../components/layout/BottomNavigation'

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
  orderType: 'sur_place' | 'reservation' | 'livraison'
  deliveryAddress?: {
    fullAddress: string
    street?: string
    city?: string
    zone?: string
  }
  reservationDetails?: {
    guestCount: number
    scheduledDateTime: string
  }
  tableNumber?: string
  createdAt: string
  status: string
  customerInfo?: {
    name?: string
    phone?: string
    email?: string
  }
}

export default function ThankYouPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      const targetOrderId = orderId || sessionStorage.getItem('faata_lastOrderId')
      
      if (!targetOrderId) {
        setError('ID de commande manquant')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Vérifier le cache d'abord
        const lastOrderData = sessionStorage.getItem('faata_lastOrderData')
        if (lastOrderData) {
          try {
            const cachedOrder = JSON.parse(lastOrderData)
            if (cachedOrder._id === targetOrderId) {
              setOrder(cachedOrder)
              setLoading(false)
              return
            }
          } catch (parseError) {
            console.error('Error parsing cached order:', parseError)
          }
        }
        
        // Sinon, récupérer depuis l'API
        const data = await ordersAPI.getById(targetOrderId)
        setOrder(data)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching order:', err)
        setError(err.message || 'Erreur lors du chargement de la commande')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return "Aujourd'hui"
    }

    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR') + ' FCFA'
  }

  const estimatedTime = () => {
    const now = new Date()
    const deliveryTime = new Date(now.getTime() + 60 * 60 * 1000) // +1h
    const nextHour = new Date(now.getTime() + 2 * 60 * 60 * 1000) // +2h
    
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
    return {
      start: deliveryTime.toLocaleTimeString('fr-FR', options),
      end: nextHour.toLocaleTimeString('fr-FR', options),
    }
  }

  const timeRange = estimatedTime()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39512a] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre commande...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16">
        <div className="text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error || 'Commande non trouvée'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#39512a] text-white rounded-lg hover:opacity-90 transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header avec icône de succès */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-green-100 mb-6">
            <svg className="w-12 h-12 md:w-16 md:h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Merci pour votre commande !
          </h1>
          <p className="text-lg text-gray-600">
            Votre commande a été confirmée avec succès
          </p>
        </div>

        {/* Carte de résumé de commande */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Résumé de votre commande</h2>
            <p className="text-sm text-gray-600">
              Commande #{order._id.slice(-8).toUpperCase()} • {formatDate(order.createdAt)}
            </p>
          </div>

          {/* Détails de la commande */}
          <div className="space-y-4 mb-6">
            {order.items.map((item, index) => {
              const productName = typeof item.productId === 'object' && item.productId?.name 
                ? item.productId.name 
                : item.name
              const productRef = typeof item.productId === 'object' && item.productId
                ? { name: item.productId.name, imageUrl: item.productId.imageUrl }
                : { name: item.name }
              const productImage = getProductImage(productRef)

              return (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  {productImage && (
                    <img 
                      src={productImage} 
                      alt={productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{productName}</p>
                    <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-[#39512a]">{formatPrice(item.price * item.quantity)}</p>
                </div>
              )
            })}
          </div>

          {/* Informations de livraison/préparation */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            {order.orderType === 'livraison' && order.deliveryAddress && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold text-gray-900">Adresse de livraison</p>
                  <p className="text-sm text-gray-600">{order.deliveryAddress.fullAddress}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Livraison estimée: {timeRange.start} - {timeRange.end}
                  </p>
                </div>
              </div>
            )}

            {order.orderType === 'sur_place' && order.tableNumber && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">🪑</span>
                <div>
                  <p className="font-semibold text-gray-900">Table {order.tableNumber}</p>
                  <p className="text-sm text-gray-600">Sur place</p>
                </div>
              </div>
            )}

            {order.orderType === 'reservation' && order.reservationDetails && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-900">Réservation</p>
                  <p className="text-sm text-gray-600">
                    {order.reservationDetails.guestCount} personne(s) • {formatDate(order.reservationDetails.scheduledDateTime)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-[#39512a]">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(`/order/${order._id}`)}
            className="flex-1 px-6 py-3 bg-[#39512a] text-white rounded-lg hover:opacity-90 transition-all font-semibold"
          >
            Voir les détails de la commande
          </button>
          <button
            onClick={() => navigate('/menu')}
            className="flex-1 px-6 py-3 bg-white border-2 border-[#39512a] text-[#39512a] rounded-lg hover:bg-[#39512a] hover:text-white transition-all font-semibold"
          >
            Continuer mes achats
          </button>
        </div>

        {/* Message informatif */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Astuce:</span> Vous pouvez suivre l'état de votre commande depuis votre profil.
          </p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

