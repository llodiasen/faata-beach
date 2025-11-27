import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ordersAPI } from '../lib/api'
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

export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')

  useEffect(() => {
    const fetchOrder = async () => {
      // D'abord, essayer de récupérer depuis sessionStorage (pour les commandes récemment créées)
      const lastOrderId = sessionStorage.getItem('faata_lastOrderId')
      const lastOrderData = sessionStorage.getItem('faata_lastOrderData')
      
      // Si on a des données en cache et que l'ID correspond (ou si pas d'ID dans l'URL)
      const targetOrderId = orderId || lastOrderId
      
      if (!targetOrderId) {
        setError('ID de commande manquant')
        setLoading(false)
        return
      }

      // Si pas d'ID dans l'URL mais qu'on a un ID en cache, mettre à jour l'URL
      if (!orderId && lastOrderId) {
        window.history.replaceState({}, '', `/order/${lastOrderId}`)
      }

      try {
        setLoading(true)
        
        // Vérifier si on a des données en cache pour cette commande
        if (lastOrderId === targetOrderId && lastOrderData) {
          try {
            const cachedOrder = JSON.parse(lastOrderData)
            console.log('Loading order from cache:', cachedOrder) // Debug log
            setOrder(cachedOrder)
            setError(null)
            setLoading(false)
            // Nettoyer le cache après utilisation pour éviter les conflits
            // sessionStorage.removeItem('faata_lastOrderData')
            return
          } catch (parseError) {
            console.error('Error parsing cached order:', parseError) // Debug log
            // Si erreur de parsing, continuer avec l'API
          }
        }
        
        // Sinon, essayer de récupérer depuis l'API
        console.log('Fetching order from API:', targetOrderId) // Debug log
        const data = await ordersAPI.getById(targetOrderId)
        console.log('Order fetched from API:', data) // Debug log
        setOrder(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching order:', err) // Debug log
        // Si erreur d'authentification ou autre, essayer de récupérer depuis sessionStorage
        if (lastOrderId === targetOrderId && lastOrderData) {
          try {
            const cachedOrder = JSON.parse(lastOrderData)
            console.log('Fallback to cached order:', cachedOrder) // Debug log
            setOrder(cachedOrder)
            setError(null)
          } catch (parseError) {
            setError('Erreur de chargement des données de commande')
          }
        } else {
          setError(err instanceof Error ? err.message : 'Erreur de chargement')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => price.toLocaleString('fr-FR')

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      preparing: 'En préparation',
      ready: 'Prête',
      assigned: 'Assignée',
      on_the_way: 'En route',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    if (status === 'delivered' || status === 'completed') return 'bg-[#39512a]'
    if (status === 'cancelled') return 'bg-red-500'
    return 'bg-orange-500'
  }

  const deliveryFee = order?.orderType === 'livraison' ? 2000 : 0
  const serviceFee = 0
  const discount = 0
  const subtotal = order?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  const total = subtotal + deliveryFee + serviceFee - discount

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center overflow-hidden">
        <div className="text-gray-600">Chargement...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="h-screen bg-white flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Commande introuvable'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#39512a] text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center flex-shrink-0">
              <img src="/images/logo.png" alt="FAATA BEACH" className="h-12 md:h-16 lg:h-20" />
            </button>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => navigate('/login')}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Se connecter"
              >
                <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
                </svg>
              </button>
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6 md:w-5 md:h-5 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header avec numéro de commande et statut */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#121212]">Commande #{order._id.slice(-6).toUpperCase()}</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Informations restaurant et livraison */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#39512a]/10 flex items-center justify-center flex-shrink-0">
              <img src="/images/logo.png" alt="FAATA BEACH" className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#121212] mb-1">FAATA BEACH</h3>
              <p className="text-sm text-gray-600">
                {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Ligne pointillée et adresse de livraison */}
          {order.orderType === 'livraison' && order.deliveryAddress && (
            <>
              <div className="flex items-center gap-4 my-4">
                <div className="w-0.5 h-8 border-l-2 border-dashed border-gray-300 ml-6"></div>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#39512a] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-[#121212] break-words">
                        {order.deliveryAddress.fullAddress}
                      </p>
                      {order.deliveryAddress.zone && (
                        <p className="text-xs text-gray-500 mt-1">Zone: {order.deliveryAddress.zone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Informations pour sur place */}
          {order.orderType === 'sur_place' && order.tableNumber && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Table:</span> {order.tableNumber}
              </p>
            </div>
          )}

          {/* Informations pour réservation */}
          {order.orderType === 'reservation' && order.reservationDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Nombre de personnes:</span> {order.reservationDetails.guestCount}
              </p>
              {order.reservationDetails.scheduledDateTime && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Date et heure:</span>{' '}
                  {formatDate(order.reservationDetails.scheduledDateTime)} •{' '}
                  {formatTime(order.reservationDetails.scheduledDateTime)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Articles de la commande */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-[#121212] mb-4">Articles commandés</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => {
              const productName = typeof item.productId === 'object' && item.productId?.name
                ? item.productId.name
                : item.name

              return (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-[#121212]">
                        #{index + 1} {productName} × {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatPrice(item.price)} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Résumé de paiement */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-[#121212] mb-4">Résumé de paiement</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Méthode de paiement</span>
              <span className="text-[#121212] font-medium">Paiement en ligne</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Sous-total ({order.items.reduce((sum, item) => sum + item.quantity, 0)} articles)</span>
              <span className="text-[#121212] font-medium">{formatPrice(subtotal)} FCFA</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Frais de livraison</span>
                <span className="text-[#121212] font-medium">{formatPrice(deliveryFee)} FCFA</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Frais de service</span>
              <span className="text-[#121212] font-medium">{formatPrice(serviceFee)} FCFA</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm text-[#39512a]">
                <span>Remise</span>
                <span className="font-medium">-{formatPrice(discount)} FCFA</span>
              </div>
            )}
            <div className="flex items-center justify-between text-lg font-bold text-[#121212] pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>{formatPrice(total)} FCFA</span>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => {
              // TODO: Implémenter le contact support
              alert('Contact support - Fonctionnalité à venir')
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-[#121212]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Contacter le support
          </button>
          <button
            onClick={() => navigate('/menu')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#39512a] hover:opacity-90 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Commander à nouveau
          </button>
        </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />

      {/* Menu modal - Mobile et Desktop */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#39512a]">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Accueil</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/menu')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Menu</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/gallery')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Galerie</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/about')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>À propos</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/location')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                    </svg>
                    <span>Nous trouver</span>
                  </button>

                  {/* Switcher de langue */}
                  <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Langue</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setLanguage('fr')
                          setShowMobileMenu(false)
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                          language === 'fr'
                            ? 'border-[#39512a] bg-[#39512a]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">🇫🇷</span>
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('en')
                          setShowMobileMenu(false)
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                          language === 'en'
                            ? 'border-[#39512a] bg-[#39512a]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">🇬🇧</span>
                      </button>
                    </div>
                  </div>
                </nav>

                <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/login')
                    }}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-all mb-2 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
                    </svg>
                    Se connecter
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/register')
                    }}
                    className="w-full px-4 py-3 bg-[#39512a] hover:opacity-90 text-white rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    S'inscrire
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

