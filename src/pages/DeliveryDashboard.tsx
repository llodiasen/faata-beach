import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { getUserRole } from '../lib/permissions'
import { deliveryAPI, ordersAPI } from '../lib/api'
import { useModalStore } from '../store/useModalStore'
import { DeliveryTrackingModal } from '../components/modals/DeliveryTrackingModal'

interface Order {
  _id: string
  status: string
  totalAmount: number
  customerInfo: { name: string; phone: string; email?: string }
  deliveryAddress?: {
    fullAddress: string
    street?: string
    city?: string
    zipCode?: string
    coordinates?: { lat: number; lng: number }
  }
  items: Array<{ name: string; quantity: number; price: number; productId?: any }>
  orderType?: string
  createdAt: string
  assignedDeliveryId?: string
}

export default function DeliveryDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { openModal, currentModal } = useModalStore()
  const [allOrders, setAllOrders] = useState<Order[]>([]) // Toutes les commandes assignées (pour l'historique)
  const [activeOrders, setActiveOrders] = useState<Order[]>([]) // Commandes actives uniquement
  const [loading, setLoading] = useState(true)
  const [selectedNav, setSelectedNav] = useState<'dashboard' | 'tracking'>('dashboard')
  const [filterPeriod, setFilterPeriod] = useState<'7days' | '30days' | 'all'>('7days')

  useEffect(() => {
    const userRole = getUserRole(user)
    if (!user || userRole !== 'delivery') {
      navigate('/')
      return
    }
    loadAllData()
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadAllData, 10000)
    return () => clearInterval(interval)
  }, [user, navigate])

  const loadAllData = async () => {
    try {
      // L'API getAll() filtre déjà les commandes pour le livreur
      const allOrdersData = await ordersAPI.getAll()
      setAllOrders(allOrdersData)
      
      // Charger les commandes actives (assigned ou on_the_way)
      const activeData = await deliveryAPI.getAssignedOrders()
      setActiveOrders(activeData)
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await deliveryAPI.updateOrderStatus(orderId, newStatus)
      loadAllData()
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut')
    }
  }

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      assigned: 'on_the_way',
      on_the_way: 'delivered',
    }
    return statusFlow[currentStatus] || null
  }

  const openNavigation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  // Calculer les statistiques
  const getStats = () => {
    const periodFilter = getPeriodFilter()
    const filteredOrders = allOrders.filter(periodFilter)

    return {
      onDelivery: filteredOrders.filter(o => o.status === 'on_the_way').length,
      onHold: filteredOrders.filter(o => o.status === 'assigned').length,
      completed: filteredOrders.filter(o => o.status === 'delivered').length,
      returned: filteredOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: filteredOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0),
    }
  }

  const getPeriodFilter = () => {
    const now = new Date()
    const daysAgo = filterPeriod === '7days' ? 7 : filterPeriod === '30days' ? 30 : Infinity
    
    if (daysAgo === Infinity) return () => true
    
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return (order: Order) => new Date(order.createdAt) >= cutoffDate
  }

  // Calculer les revenus par période (7 derniers jours)
  const getRevenueChart = () => {
    const now = new Date()
    const days: { [key: string]: number } = {}
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      days[dateKey] = 0
    }
    
    allOrders
      .filter(o => o.status === 'delivered')
      .forEach(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
        if (days[orderDate] !== undefined) {
          days[orderDate] += order.totalAmount
        }
      })
    
    return Object.entries(days).map(([date, revenue]) => {
      const d = new Date(date)
      return {
        label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        value: revenue,
        fullDate: date
      }
    })
  }

  // Calculer les types de livraison (pour le donut chart)
  const getServicesChart = () => {
    const periodFilter = getPeriodFilter()
    const filteredOrders = allOrders.filter(periodFilter)
    
    const types: { [key: string]: number } = {}
    filteredOrders.forEach(order => {
      const type = order.orderType || 'autre'
      types[type] = (types[type] || 0) + 1
    })
    
    return Object.entries(types).map(([type, count]) => ({
      label: type === 'sur_place' ? 'Sur place' : type === 'emporter' ? 'À emporter' : type === 'livraison' ? 'Livraison' : 'Autre',
      value: count,
      color: type === 'sur_place' ? '#10B981' : type === 'emporter' ? '#3B82F6' : type === 'livraison' ? '#F59E0B' : '#6B7280'
    }))
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      assigned: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      on_the_way: { bg: 'bg-blue-100', text: 'text-blue-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    }
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      assigned: 'Assignée',
      on_the_way: 'En cours',
      delivered: 'Complétée',
      cancelled: 'Annulée',
    }
    return labels[status] || status
  }

  const getDisplayOrders = () => {
    if (selectedNav === 'tracking') {
      const periodFilter = getPeriodFilter()
      return allOrders.filter(periodFilter).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    return activeOrders
  }

  const userRole = getUserRole(user)
  if (!user || userRole !== 'delivery') return null

  const stats = getStats()
  const revenueChart = getRevenueChart()
  const servicesChart = getServicesChart()
  const totalServices = servicesChart.reduce((sum, item) => sum + item.value, 0)
  const maxRevenueValue = Math.max(...revenueChart.map(r => r.value), 1000)
  const displayOrders = getDisplayOrders()

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tracking', label: 'Suivi', icon: '📦' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-0 h-full z-10">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🚚</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FAATA Beach</h1>
              <p className="text-xs text-gray-500">Service Livraison</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">MENU</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedNav(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedNav === item.id
                  ? 'bg-purple-100 text-purple-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">Livreur</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bonjour, {user.name} 👋</h2>
              <p className="text-sm text-gray-500 mt-1">Gérez vos livraisons efficacement</p>
            </div>
            <div className="flex items-center gap-4">
              {activeOrders.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium">{activeOrders.length} commande{activeOrders.length > 1 ? 's' : ''} active{activeOrders.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          {selectedNav === 'dashboard' && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">En cours</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.onDelivery}+</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🚚</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -mr-8 -mt-8"></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">En attente</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.onHold}+</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⏸️</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-50 rounded-full -mr-8 -mt-8"></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Complétées</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.completed.toLocaleString('fr-FR')}+</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full -mr-8 -mt-8"></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Annulées</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.returned}+</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">❌</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-full -mr-8 -mt-8"></div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Total Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Revenus Totaux</h3>
                    <select 
                      value={filterPeriod}
                      onChange={(e) => setFilterPeriod(e.target.value as any)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="7days">7 Jours</option>
                      <option value="30days">30 Jours</option>
                      <option value="all">Tout</option>
                    </select>
                  </div>
                  
                  <div className="h-64 flex items-end justify-between gap-2">
                    {revenueChart.map((day, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t transition-all hover:opacity-80 cursor-pointer"
                            style={{
                              height: `${Math.max((day.value / maxRevenueValue) * 240, 10)}px`,
                              minHeight: '10px'
                            }}
                            title={`${day.label}: ${day.value.toLocaleString('fr-FR')} CFA`}
                          />
                          <span className="text-xs text-gray-600 font-medium">{day.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Services Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Types de Commandes</h3>
                  </div>
                  
                  {/* Simple Donut Chart */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                        />
                        {servicesChart.length > 0 && servicesChart.map((item, index) => {
                          const previousSum = servicesChart.slice(0, index).reduce((sum, i) => sum + i.value, 0)
                          const circumference = 2 * Math.PI * 40
                          const percentage = totalServices > 0 ? (item.value / totalServices) * 100 : 0
                          const strokeDasharray = (percentage / 100) * circumference
                          const strokeDashoffset = totalServices > 0 
                            ? circumference - (previousSum / totalServices) * circumference - strokeDasharray
                            : 0
                          
                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="8"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                            />
                          )
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {totalServices}
                        </span>
                        <span className="text-xs text-gray-500">TOTAL</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {servicesChart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Orders List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Commandes Actives</h3>
                  <p className="text-sm text-gray-500 mt-1">Commandes assignées en cours de livraison</p>
                </div>
                
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Chargement...</div>
                  ) : activeOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg mb-2">Aucune commande active</p>
                      <p className="text-sm">Les nouvelles commandes assignées apparaîtront ici</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeOrders.map((order) => {
                        const nextStatus = getNextStatus(order.status)
                        const statusColor = getStatusColor(order.status)
                        return (
                          <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  #{order._id.slice(-6)}
                                </p>
                                <p className="text-sm text-gray-600">{order.customerInfo.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            
                            {order.deliveryAddress && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">Adresse:</p>
                                <p className="text-sm text-gray-700">{order.deliveryAddress.fullAddress}</p>
                              </div>
                            )}
                            
                            <div className="mb-3 pt-3 border-t border-gray-100">
                              <p className="text-lg font-bold text-purple-600">
                                {order.totalAmount.toLocaleString('fr-FR')} CFA
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {order.deliveryAddress?.coordinates && (
                                <>
                                  <button
                                    onClick={() => {
                                      useModalStore.getState().setSelectedOrder(order._id)
                                      openModal('deliveryTracking')
                                    }}
                                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                  >
                                    <span>🗺️</span>
                                    Voir la carte
                                  </button>
                                  <button
                                    onClick={() => openNavigation(
                                      order.deliveryAddress!.coordinates!.lat,
                                      order.deliveryAddress!.coordinates!.lng
                                    )}
                                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                                    title="Ouvrir dans Google Maps"
                                  >
                                    📍
                                  </button>
                                </>
                              )}
                              {nextStatus && (
                                <button
                                  onClick={() => updateOrderStatus(order._id, nextStatus)}
                                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                                >
                                  {nextStatus === 'on_the_way' ? '🚚 En route' : '✅ Livrée'}
                                </button>
                              )}
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

          {selectedNav === 'tracking' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Liste de Suivi</h3>
                  <p className="text-sm text-gray-500 mt-1">Historique de toutes vos livraisons</p>
                </div>
                <select 
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="7days">7 Jours</option>
                  <option value="30days">30 Jours</option>
                  <option value="all">Tout</option>
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Adresse</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Numéro</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Chargement...
                        </td>
                      </tr>
                    ) : displayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Aucune commande
                        </td>
                      </tr>
                    ) : (
                      displayOrders.map((order) => {
                        const statusColor = getStatusColor(order.status)
                        return (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-xs">
                                  {order.customerInfo.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{order.customerInfo.name}</p>
                                  <p className="text-xs text-gray-500">{order.customerInfo.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {order.deliveryAddress?.fullAddress || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {order.orderType === 'sur_place' ? 'Sur place' : 
                               order.orderType === 'emporter' ? 'À emporter' : 
                               order.orderType === 'livraison' ? 'Livraison' : 
                               'Autre'}
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-gray-900">
                              #{order._id.slice(-8)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {order.totalAmount.toLocaleString('fr-FR')} CFA
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {currentModal === 'deliveryTracking' && <DeliveryTrackingModal />}
    </div>
  )
}
