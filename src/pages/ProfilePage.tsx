import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useModalStore } from '../store/useModalStore'
import { ordersAPI, reservationsAPI, authAPI } from '../lib/api'
import { ReservationModal } from '../components/modals/ReservationModal'
import { OrderTrackingModal } from '../components/modals/OrderTrackingModal'

interface Order {
  _id: string
  status: string
  totalAmount: number
  createdAt: string
  items: Array<{ name: string; quantity: number; price: number }>
  orderType?: string
}

interface Reservation {
  _id: string
  date: string
  time: string
  numberOfGuests: number
  status: string
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { openModal, currentModal } = useModalStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNav, setSelectedNav] = useState<'dashboard' | 'orders' | 'payment' | 'tracking' | 'profile' | 'notifications'>('dashboard')
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<string | null>(null)
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState({
    orderStatus: true,
    promotions: false,
    newsletter: true,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadOrders()
    loadReservations()
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user, navigate])

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll()
      setOrders(data)
    } catch (error) {
      console.error('Erreur chargement commandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReservations = async () => {
    try {
      const data = await reservationsAPI.getAll()
      setReservations(data)
    } catch (error) {
      console.error('Erreur chargement réservations:', error)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await authAPI.updateProfile(formData)
      // Mettre à jour le store avec les nouvelles données
      const { setUser } = useAuthStore.getState()
      setUser({
        ...user!,
        ...updatedUser,
      })
      alert('Profil mis à jour avec succès')
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error)
      alert(error.message || 'Erreur lors de la mise à jour du profil')
    }
  }

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas')
        return
      }
      if (passwordData.newPassword.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères')
        return
      }
      
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      
      alert('Mot de passe modifié avec succès')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error)
      alert(error.message || 'Erreur lors du changement de mot de passe')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleOrderClick = (orderId: string) => {
    useModalStore.getState().setSelectedOrder(orderId)
    openModal('orderTracking')
  }

  const loadTrackingOrder = async (orderId: string) => {
    setTrackingLoading(true)
    try {
      const data = await ordersAPI.getById(orderId)
      setTrackingOrder(data)
      setSelectedOrderForTracking(orderId)
    } catch (error) {
      console.error('Erreur chargement commande:', error)
      setTrackingOrder(null)
    } finally {
      setTrackingLoading(false)
    }
  }

  const getStatusSteps = () => {
    if (!trackingOrder) return []
    
    const baseSteps = [
      { key: 'pending', label: 'En attente', icon: '⏳' },
      { key: 'accepted', label: 'Acceptée', icon: '✅' },
      { key: 'preparing', label: 'En préparation', icon: '👨‍🍳' },
      { key: 'ready', label: 'Prête', icon: '🍽️' },
    ]

    if (trackingOrder.orderType === 'livraison') {
      return [
        ...baseSteps,
        { key: 'assigned', label: 'Livreur assigné', icon: '🚚' },
        { key: 'on_the_way', label: 'En route', icon: '🛣️' },
        { key: 'delivered', label: 'Livrée', icon: '🎉' }
      ]
    }
    
    return [
      ...baseSteps,
      { key: 'completed', label: 'Terminée', icon: '🎉' }
    ]
  }

  const getCurrentStepIndex = () => {
    if (!trackingOrder) return -1
    const steps = getStatusSteps()
    const stepIndex = steps.findIndex(step => step.key === trackingOrder.status)
    if (stepIndex === -1 && trackingOrder.status === 'completed') {
      return steps.length - 1
    }
    return stepIndex
  }

  // Polling pour mettre à jour le statut en temps réel
  useEffect(() => {
    if (selectedNav === 'tracking' && selectedOrderForTracking) {
      loadTrackingOrder(selectedOrderForTracking)
      const interval = setInterval(() => {
        if (selectedOrderForTracking) {
          loadTrackingOrder(selectedOrderForTracking)
        }
      }, 5000)
      return () => clearInterval(interval)
    } else if (selectedNav !== 'tracking') {
      setTrackingOrder(null)
      setSelectedOrderForTracking(null)
    }
  }, [selectedNav, selectedOrderForTracking])

  const getTotalOrders = () => orders.length
  const getDeliveredOrders = () => orders.filter(o => o.status === 'delivered' || o.status === 'completed').length

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
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
    }
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      preparing: 'En préparation',
      ready: 'Prête',
      assigned: 'Livreur assigné',
      on_the_way: 'En route',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      completed: 'Terminée',
    }
    return labels[status] || status
  }

  if (!user) return null

  const recentOrders = orders.slice(0, 5)

  // Initiales pour l'avatar (première lettre seulement)
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase() || 'U'
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white fixed left-0 top-0 h-full z-10">
        {/* User Profile */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-faata-red flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {getInitial(user.name || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base mb-1">{user.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-orange-500 text-base">🎁</span>
                <span className="text-sm text-gray-600">{getTotalOrders()} Commandes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-4">
          <button
            onClick={() => setSelectedNav('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1.5 text-base ${
              selectedNav === 'dashboard'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">🏠</span>
            <span>Tableau de bord</span>
          </button>
          <button
            onClick={() => setSelectedNav('orders')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1.5 text-base ${
              selectedNav === 'orders'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">📋</span>
            <span>Mes commandes</span>
          </button>
          <button
            onClick={() => setSelectedNav('payment')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1.5 text-base ${
              selectedNav === 'payment'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">💳</span>
            <span>Méthodes de paiement</span>
          </button>
          <button
            onClick={() => setSelectedNav('tracking')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1.5 text-base ${
              selectedNav === 'tracking'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">📍</span>
            <span>Suivre ma commande</span>
          </button>
        </nav>

        {/* Account Management */}
        <div className="p-4 mt-2">
          <p className="text-sm font-bold text-gray-900 mb-3 px-4">Mon compte</p>
          <button
            onClick={() => setSelectedNav('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1.5 text-base ${
              selectedNav === 'profile'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">👤</span>
            <span>Informations personnelles</span>
          </button>
          <button
            onClick={() => setSelectedNav('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1.5 text-base ${
              selectedNav === 'notifications'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">🔔</span>
            <span>Notifications</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-red-600 hover:bg-red-50 text-base"
          >
            <span className="text-lg">←</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 bg-white">
        <div className="p-8 max-w-6xl">
          {selectedNav === 'dashboard' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Total Orders */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-2 font-medium">Commandes totales</p>
                      <p className="text-5xl font-bold text-gray-900">{getTotalOrders()}</p>
                    </div>
                  </div>
                </div>

                {/* Delivered Orders */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-2 font-medium">Commandes livrées</p>
                      <p className="text-5xl font-bold text-gray-900">{getDeliveredOrders()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Orders */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Dernières commandes</h2>
                  <button
                    onClick={() => setSelectedNav('orders')}
                    className="px-3 py-1.5 border-2 border-faata-red text-faata-red bg-white rounded-lg hover:bg-red-50 transition-colors font-medium text-xs"
                  >
                    Voir toutes les commandes
                  </button>
                </div>
                
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Chargement...</div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-base">Vous n'avez pas encore de commande.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => {
                        const statusColor = getStatusColor(order.status)
                        return (
                          <div
                            key={order._id}
                            onClick={() => handleOrderClick(order._id)}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Commande #{order._id.slice(-6)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3">
                              <div className="text-sm text-gray-600">
                                {order.items.length} article{order.items.length > 1 ? 's' : ''}
                              </div>
                              <p className="text-lg font-bold text-faata-red">
                                {order.totalAmount.toLocaleString('fr-FR')} CFA
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {selectedNav === 'orders' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes commandes</h1>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-gray-600 text-base mb-2">Vous n'avez pas encore de commande.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-faata-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    Passer une commande
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const statusColor = getStatusColor(order.status)
                    return (
                      <div
                        key={order._id}
                        onClick={() => handleOrderClick(order._id)}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-bold text-gray-900">
                              Commande #{order._id.slice(-6)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {order.orderType && (
                              <p className="text-xs text-gray-500 mt-1">
                                {order.orderType === 'sur_place' ? 'Sur place' : 
                                 order.orderType === 'emporter' ? 'À emporter' : 
                                 'Livraison'}
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm text-gray-600">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{item.price.toLocaleString('fr-FR')} CFA</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-gray-500">+ {order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center pt-4">
                          <span className="text-sm text-gray-600">Total</span>
                          <span className="text-xl font-bold text-faata-red">
                            {order.totalAmount.toLocaleString('fr-FR')} CFA
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {selectedNav === 'payment' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Méthodes de paiement</h1>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Mes méthodes de paiement</h2>
                
                <div className="space-y-6">
                  {/* Paiement à la livraison */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Paiement à la livraison</h3>
                      <p className="text-sm text-gray-600">
                        Paiement en espèces à la réception de votre commande
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className="px-4 py-1.5 bg-green-600 text-white rounded-full text-sm font-semibold">
                        Actif
                      </span>
                    </div>
                  </div>

                  {/* Paiement par carte bancaire */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Paiement par carte bancaire</h3>
                      <p className="text-sm text-gray-600">
                        Prochainement disponible
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className="px-4 py-1.5 bg-gray-500 text-white rounded-full text-sm font-semibold">
                        À venir
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedNav === 'tracking' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Suivre ma commande</h1>
              
              {!selectedOrderForTracking ? (
                <div className="space-y-6">
                  {/* Sélection de commande */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Sélectionner une commande</h2>
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Chargement...</div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Vous n'avez pas encore de commande.</p>
                        <button
                          onClick={() => navigate('/')}
                          className="mt-4 px-4 py-2 bg-faata-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                          Passer une commande
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {orders.map((order) => (
                          <button
                            key={order._id}
                            onClick={() => loadTrackingOrder(order._id)}
                            className="p-4 border border-gray-200 rounded-lg hover:border-faata-red hover:shadow-md transition-all text-left"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Commande #{order._id.slice(-6)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-faata-red mt-2">
                              {order.totalAmount.toLocaleString('fr-FR')} CFA
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bouton retour */}
                  <button
                    onClick={() => {
                      setSelectedOrderForTracking(null)
                      setTrackingOrder(null)
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <span>←</span>
                    <span>Retour à la sélection</span>
                  </button>

                  {trackingLoading ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <p className="text-gray-500">Chargement...</p>
                    </div>
                  ) : !trackingOrder ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <p className="text-red-600">Commande non trouvée</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      {/* Timeline */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Statut de la commande</h2>
                        <div className="relative">
                          {getStatusSteps().map((step, index) => {
                            const currentStepIndex = getCurrentStepIndex()
                            const isActive = index <= currentStepIndex
                            
                            return (
                              <div key={step.key} className="flex items-start gap-4 mb-6">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                                  isActive
                                    ? 'bg-faata-red text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-400'
                                }`}>
                                  {index < currentStepIndex ? '✓' : step.icon}
                                </div>
                                <div className="flex-1">
                                  <p className={`font-semibold text-base ${
                                    isActive ? 'text-gray-900' : 'text-gray-400'
                                  }`}>
                                    {step.label}
                                  </p>
                                  {index < getStatusSteps().length - 1 && (
                                    <div className={`h-10 w-0.5 ml-6 mt-2 transition-colors ${
                                      index < currentStepIndex ? 'bg-faata-red' : 'bg-gray-200'
                                    }`} />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Détails de la commande */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Numéro de commande</p>
                          <p className="text-base font-semibold text-gray-900">#{trackingOrder._id.slice(-6)}</p>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-gray-700 font-semibold">Total:</span>
                          <span className="text-xl font-bold text-faata-red">
                            {trackingOrder.totalAmount.toLocaleString('fr-FR')} CFA
                          </span>
                        </div>
                        {trackingOrder.orderType && (
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">Type de commande</p>
                            <p className="text-base font-medium text-gray-900">
                              {trackingOrder.orderType === 'sur_place' ? 'Sur place' : 
                               trackingOrder.orderType === 'emporter' ? 'À emporter' : 
                               'Livraison'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Articles */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Articles commandés</h3>
                        <div className="space-y-2">
                          {trackingOrder.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.name} x{item.quantity}</span>
                              <span className="text-gray-900 font-medium">{item.price.toLocaleString('fr-FR')} CFA</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedNav === 'profile' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon compte</h1>
              
              {/* Informations personnelles */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">Nom complet</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-faata-red focus:border-transparent"
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-faata-red focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-faata-red focus:border-transparent"
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 bg-faata-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Mettre à jour le profil
                    </button>
                  </div>
                </div>
              </div>

              {/* Changer le mot de passe */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Changer le mot de passe</h2>
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-faata-red focus:border-transparent"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-faata-red focus:border-transparent"
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-faata-red focus:border-transparent"
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleChangePassword}
                      className="px-4 py-2 bg-faata-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Changer le mot de passe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedNav === 'notifications' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Notifications</h1>
              
              {/* Préférences de notifications */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Préférences de notifications</h2>
                
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Statut des commandes</h3>
                      <p className="text-sm text-gray-600">Recevez des notifications sur l'état de vos commandes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.orderStatus}
                        onChange={(e) => setNotificationPreferences({ ...notificationPreferences, orderStatus: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-faata-red rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-faata-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Promotions et offres</h3>
                      <p className="text-sm text-gray-600">Recevez des notifications sur nos promotions et offres spéciales</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.promotions}
                        onChange={(e) => setNotificationPreferences({ ...notificationPreferences, promotions: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-faata-red rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-faata-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Newsletter</h3>
                      <p className="text-sm text-gray-600">Recevez notre newsletter avec les dernières actualités</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.newsletter}
                        onChange={(e) => setNotificationPreferences({ ...notificationPreferences, newsletter: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-faata-red rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-faata-red"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Historique des notifications */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Historique des notifications</h2>
                
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.slice(0, 10).map((order) => (
                      <div key={order._id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-lg">📦</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            Commande #{order._id.slice(-6)} - {getStatusLabel(order.status)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucune notification pour le moment</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {currentModal === 'reservation' && <ReservationModal />}
      {currentModal === 'orderTracking' && <OrderTrackingModal />}
    </div>
  )
}
