import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { getUserRole } from '../lib/permissions'
import { ordersAPI, productsAPI, usersAPI, categoriesAPI } from '../lib/api'
import { useModalStore } from '../store/useModalStore'
import { AssignDeliveryModal } from '../components/modals/AssignDeliveryModal'
import { OrderDetailsModal } from '../components/modals/OrderDetailsModal'

interface Order {
  _id: string
  status: string
  totalAmount: number
  customerInfo: { name: string; phone: string; email?: string }
  items: Array<{ name: string; quantity: number; price: number; productId?: any }>
  orderType?: string
  createdAt: string
  assignedDeliveryId?: string
}

interface Product {
  _id: string
  name: string
  imageUrl?: string
  price: number
  isAvailable?: boolean
  categoryId?: string | { _id: string; name: string } | any
  category?: { name: string }
}

interface TopSellingProduct {
  productId: string
  name: string
  imageUrl?: string
  quantity: number
  revenue: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { openModal, currentModal } = useModalStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNav, setSelectedNav] = useState<'dashboard' | 'products' | 'orders' | 'customers' | 'analytics' | 'settings'>('dashboard')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'cancelled'>('in_progress')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [showGroupedActions, setShowGroupedActions] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all')
  const [showChannelFilter, setShowChannelFilter] = useState(false)
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all')
  const [analyticsTab, setAnalyticsTab] = useState<'byDate' | 'byProduct' | 'byCategory' | 'promoCodes' | 'downloads'>('byDate')
  const [dateRange, setDateRange] = useState<'year' | 'lastMonth' | 'thisMonth' | 'last7Days' | 'custom'>('thisMonth')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  useEffect(() => {
    const userRole = getUserRole(user)
    if (!user || userRole !== 'admin') {
      navigate('/')
      return
    }
    loadData()

    // Écouter les mises à jour de commande
    const handleOrderUpdate = () => {
      loadData()
    }
    window.addEventListener('orderUpdated', handleOrderUpdate)
    
    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdate)
    }
  }, [user, navigate])

  // Fermer les menus déroulants quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (showGroupedActions) {
        const relativeElement = target.closest('.relative')
        if (!relativeElement) {
          setShowGroupedActions(false)
        }
      }
      
      if (showDateFilter) {
        const relativeElement = target.closest('.relative')
        if (!relativeElement) {
          setShowDateFilter(false)
        }
      }
      
      if (showChannelFilter) {
        const relativeElement = target.closest('.relative')
        if (!relativeElement) {
          setShowChannelFilter(false)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showGroupedActions, showDateFilter, showChannelFilter])

  const loadData = async () => {
    try {
      const [ordersData, productsData, customersData, categoriesData] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
        usersAPI.getAll().catch(() => []),
        categoriesAPI.getAll().catch(() => [])
      ])
      setOrders(ordersData)
      setProducts(productsData)
      setCustomers(customersData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleAssignDelivery = (orderId: string) => {
    useModalStore.getState().setSelectedOrder(orderId)
    openModal('assignDelivery')
  }

  const handleOrderClick = (orderId: string) => {
    useModalStore.getState().setSelectedOrder(orderId)
    openModal('orderDetails')
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedOrders.length === 0) return
    
    try {
      await Promise.all(
        selectedOrders.map(orderId => ordersAPI.updateStatus(orderId, status))
      )
      setSelectedOrders([])
      setShowGroupedActions(false)
      loadData()
    } catch (error) {
      console.error('Erreur mise à jour en masse:', error)
      alert('Erreur lors de la mise à jour des commandes')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOrders.length} commande(s) ?`)) {
      return
    }
    
    try {
      // Pour l'instant, on met simplement le statut à "cancelled"
      await handleBulkStatusUpdate('cancelled')
    } catch (error) {
      console.error('Erreur suppression en masse:', error)
      alert('Erreur lors de la suppression des commandes')
    }
  }

  // Générer la liste des mois disponibles
  const getAvailableMonths = () => {
    const months: string[] = []
    const now = new Date()
    
    // Générer les 12 derniers mois
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
      const monthName = monthNames[date.getMonth()]
      const year = date.getFullYear()
      months.push(`${monthName} ${year}`)
    }
    
    return months
  }

  // Filtrer les commandes selon les critères
  const filteredOrders = orders.filter((order) => {
    // Filtre par statut
    if (orderStatusFilter === 'in_progress') {
      if (!['pending', 'accepted', 'preparing', 'ready', 'assigned', 'on_the_way'].includes(order.status)) {
        return false
      }
    } else if (orderStatusFilter === 'cancelled') {
      if (order.status !== 'cancelled') {
        return false
      }
    }
    
    // Filtre par date
    if (selectedDateFilter !== 'all') {
      const orderDate = new Date(order.createdAt)
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
      const orderMonth = `${monthNames[orderDate.getMonth()]} ${orderDate.getFullYear()}`
      
      if (orderMonth !== selectedDateFilter) {
        return false
      }
    }
    
    // Filtre par canal de vente (type de commande)
    if (selectedChannelFilter !== 'all') {
      const orderTypeMap: { [key: string]: string } = {
        'sur_place': 'Sur place',
        'emporter': 'Emporter',
        'livraison': 'Livraison'
      }
      
      if (orderTypeMap[order.orderType || ''] !== selectedChannelFilter) {
        return false
      }
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const orderNumber = order._id.slice(-4).toLowerCase()
      const customerName = (order.customerInfo.name || '').toLowerCase()
      const customerPhone = (order.customerInfo.phone || '').toLowerCase()
      
      if (!orderNumber.includes(query) && !customerName.includes(query) && !customerPhone.includes(query)) {
        return false
      }
    }
    
    return true
  })

  // Filtrer les clients selon les critères
  const filteredCustomers = customers.filter((customer) => {
    // Filtre par recherche
    if (customerSearchQuery) {
      const query = customerSearchQuery.toLowerCase()
      const name = (customer.name || '').toLowerCase()
      const email = (customer.email || '').toLowerCase()
      
      if (!name.includes(query) && !email.includes(query)) {
        return false
      }
    }
    
    return true
  })

  // Filtrer les produits selon les critères
  const filteredProducts = products.filter((product) => {
    // Filtre par statut
    if (productStatusFilter === 'active') {
      if (!product.isAvailable) {
        return false
      }
    } else if (productStatusFilter === 'draft') {
      // Pour l'instant, on considère les produits non disponibles comme brouillons
      if (product.isAvailable) {
        return false
      }
    } else if (productStatusFilter === 'archived') {
      // Pour l'instant, on considère qu'il n'y a pas de produits archivés
      // On pourrait ajouter un champ isArchived dans le modèle plus tard
      return false
    }
    // Si 'all', on ne filtre pas par statut
    
    // Filtre par recherche
    if (productSearchQuery) {
      const query = productSearchQuery.toLowerCase()
      const name = (product.name || '').toLowerCase()
      const productCategoryId = typeof product.categoryId === 'string' 
        ? product.categoryId 
        : product.categoryId?._id?.toString() || product.categoryId?.toString() || product.categoryId
      const category = categories.find(c => {
        const catId = c._id?.toString() || c._id
        return catId === productCategoryId || catId?.toString() === productCategoryId?.toString()
      })
      const categoryName = category?.name?.toLowerCase() || ''
      
      if (!name.includes(query) && !categoryName.includes(query)) {
        return false
      }
    }
    
    return true
  })

  // Calculer les statistiques
  const stats = {
    totalSales: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    pendingOrders: orders.filter(o => ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'on_the_way'].includes(o.status)).length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
  }

  const getDeliveredOrders = () => {
    return orders.filter(o => o.status === 'delivered' || o.status === 'completed').length
  }

  // Fonction d'export CSV pour Analytics
  const handleExportCSV = () => {
    const analyticsData = getAnalyticsData()
    const headers = ['Métrique', 'Valeur']
    const rows = [
      ['Ventes brutes (CFA)', analyticsData.grossSales.toLocaleString('fr-FR')],
      ['Ventes nettes (CFA)', analyticsData.netSales.toLocaleString('fr-FR')],
      ['Commandes passées', analyticsData.totalOrders.toString()],
      ['Articles achetés', analyticsData.totalItems.toString()],
      ['Panier moyen (CFA)', Math.round(analyticsData.averageCart).toLocaleString('fr-FR')],
      ['Période', dateRange === 'year' ? 'Année' : dateRange === 'lastMonth' ? 'Mois dernier' : dateRange === 'thisMonth' ? 'Ce mois' : dateRange === 'last7Days' ? '7 derniers jours' : 'Personnalisé'],
    ]
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Calculer les données analytics selon la période sélectionnée
  const getAnalyticsData = () => {
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    // Définir la période selon le filtre
    switch (dateRange) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last7Days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          endDate = new Date(customEndDate)
        }
        break
    }

    // Filtrer les commandes dans la période
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= startDate && orderDate <= endDate
    })

    // Calculer les métriques
    const grossSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const netSales = grossSales // Pour l'instant, ventes nettes = ventes brutes
    const totalOrders = filteredOrders.length
    const totalItems = filteredOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0)
    }, 0)
    const averageCart = totalOrders > 0 ? grossSales / totalOrders : 0

    return {
      grossSales,
      netSales,
      totalOrders,
      totalItems,
      averageCart,
    }
  }

  // Calculer les ventes par mois (derniers 4 mois)
  const getMonthlySales = () => {
    const months: { [key: string]: number } = {}
    const now = new Date()
    
    orders.forEach(order => {
      const date = new Date(order.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Garder seulement les 4 derniers mois
      const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      if (date >= fourMonthsAgo) {
        months[monthKey] = (months[monthKey] || 0) + order.totalAmount
      }
    })
    
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const sortedMonths = Object.keys(months).sort().slice(-4)
    
    return sortedMonths.map(key => {
      const [, month] = key.split('-')
      return {
        label: monthNames[parseInt(month) - 1],
        value: months[key],
        month: parseInt(month)
      }
    })
  }

  // Calculer les top produits vendus
  const getTopSellingProducts = (): TopSellingProduct[] => {
    const productMap: { [key: string]: TopSellingProduct } = {}
    
    orders.forEach(order => {
      order.items.forEach(item => {
        // Gérer différents formats de productId (peut être un objet ou une string)
        const productId = typeof item.productId === 'object' && item.productId?._id 
          ? item.productId._id.toString()
          : (item.productId?.toString() || item.name || 'unknown')
        
        if (!productMap[productId]) {
          productMap[productId] = {
            productId,
            name: item.name,
            imageUrl: typeof item.productId === 'object' && item.productId?.imageUrl 
              ? item.productId.imageUrl 
              : undefined,
            quantity: 0,
            revenue: 0
          }
        }
        productMap[productId].quantity += item.quantity
        productMap[productId].revenue += item.price * item.quantity
      })
    })
    
    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  // Calculer les ventes par type de commande (pour le donut chart)
  const getSalesByType = () => {
    const types: { [key: string]: number } = {}
    orders.forEach(order => {
      const type = order.orderType || 'autre'
      types[type] = (types[type] || 0) + order.totalAmount
    })
    
    return Object.entries(types).map(([type, value]) => ({
      label: type === 'sur_place' ? 'Sur place' : type === 'emporter' ? 'À emporter' : type === 'livraison' ? 'Livraison' : 'Autre',
      value,
      color: type === 'sur_place' ? '#10B981' : type === 'emporter' ? '#3B82F6' : type === 'livraison' ? '#F59E0B' : '#6B7280'
    }))
  }

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

  const monthlySales = getMonthlySales()
  const topProducts = getTopSellingProducts()
  const salesByType = getSalesByType()
  const totalSalesByType = salesByType.reduce((sum, item) => sum + item.value, 0)

  const userRole = getUserRole(user)
  if (!user || userRole !== 'admin') return null

  const recentOrders = orders.slice(0, 5)
  const maxMonthlyValue = Math.max(...monthlySales.map(m => m.value), 1000)

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Produits', icon: '🍽️' },
    { id: 'orders', label: 'Commandes', icon: '📦' },
    { id: 'customers', label: 'Clients', icon: '👥' },
    { id: 'analytics', label: 'Analytiques', icon: '📈' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' },
  ]

  // Initiales pour l'avatar
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase() || 'A'
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white fixed left-0 top-0 h-full z-10">
        {/* User Profile */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-faata-red flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {getInitial(user.name || 'A')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base mb-1">{user.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-orange-500 text-base">🎁</span>
                <span className="text-sm text-gray-600">{stats.totalOrders} Commandes</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedNav(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1.5 text-base ${
                selectedNav === item.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Account Management */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
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
              {/* Header */}
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

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
                      <p className="text-5xl font-bold text-gray-900">{stats.totalOrders}</p>
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

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Sales Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Ventes Mensuelles</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stats.totalSales.toLocaleString('fr-FR')} CFA
                      </p>
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold mt-1">
                        +45%
                      </span>
                    </div>
                  </div>
                  
                  {/* Bar Chart */}
                  <div className="h-64 flex items-end justify-between gap-4">
                    {monthlySales.length > 0 ? (
                      monthlySales.map((month, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-faata-red rounded-t transition-all hover:opacity-80 cursor-pointer"
                              style={{
                                height: `${Math.max((month.value / maxMonthlyValue) * 240, 20)}px`,
                                minHeight: '20px'
                              }}
                              title={`${month.label}: ${month.value.toLocaleString('fr-FR')} CFA`}
                            />
                            <span className="text-xs text-gray-600 font-medium">{month.label}</span>
                            <span className="text-xs text-gray-500">{Math.round(month.value / 1000)}k</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <p>Aucune donnée disponible</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sales Statistics Donut */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Statistiques Ventes</h3>
                    <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white">
                      <option>Mensuel</option>
                      <option>Hebdomadaire</option>
                      <option>Journalier</option>
                    </select>
                  </div>
                  
                  {/* Simple Donut Chart */}
                  <div className="flex items-center justify-center">
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
                        {salesByType.length > 0 && salesByType.map((item, index) => {
                          const previousSum = salesByType.slice(0, index).reduce((sum, i) => sum + i.value, 0)
                          const circumference = 2 * Math.PI * 40
                          const percentage = totalSalesByType > 0 ? (item.value / totalSalesByType) * 100 : 0
                          const strokeDasharray = (percentage / 100) * circumference
                          const strokeDashoffset = totalSalesByType > 0 
                            ? circumference - (previousSum / totalSalesByType) * circumference - strokeDasharray
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
                          {totalSalesByType.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-xs text-gray-500">CFA</span>
                        <span className="text-xs text-green-600 font-semibold mt-1">+45%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    {salesByType.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {item.value.toLocaleString('fr-FR')} CFA
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Total</span>
                        <span className="text-sm font-bold text-gray-900">
                          {totalSalesByType.toLocaleString('fr-FR')} CFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tables Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Dernières commandes</h3>
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

                {/* Top Selling Products */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Top Produits</h3>
                    <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white">
                      <option>Mensuel</option>
                      <option>Hebdomadaire</option>
                    </select>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Chargement...</div>
                    ) : topProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Aucun produit vendu</div>
                    ) : (
                      topProducts.map((product) => (
                        <div key={product.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">🍽️</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm text-gray-500">Quantité: {product.quantity}</p>
                            <p className="text-sm font-semibold text-faata-red mt-1">
                              {product.revenue.toLocaleString('fr-FR')} CFA
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedNav === 'orders' && (
            <div>
              {/* Header avec recherche */}
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-faata-red focus:border-transparent"
                  />
                </div>
              </div>

              {/* Onglets de statut */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setOrderStatusFilter('all')}
                  className={`pb-3 px-4 font-medium text-sm ${
                    orderStatusFilter === 'all'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tout ({orders.length})
                </button>
                <button
                  onClick={() => setOrderStatusFilter('in_progress')}
                  className={`pb-3 px-4 font-medium text-sm ${
                    orderStatusFilter === 'in_progress'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En cours ({orders.filter(o => ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'on_the_way'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setOrderStatusFilter('cancelled')}
                  className={`pb-3 px-4 font-medium text-sm ${
                    orderStatusFilter === 'cancelled'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Annulée ({orders.filter(o => o.status === 'cancelled').length})
                </button>
              </div>

              {/* Barre de filtres */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="relative">
                  <button
                    onClick={() => setShowGroupedActions(!showGroupedActions)}
                    disabled={selectedOrders.length === 0}
                    className={`px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                      selectedOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Actions groupées
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showGroupedActions && selectedOrders.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold text-sm">
                        Actions groupées
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleBulkStatusUpdate('accepted')
                            setShowGroupedActions(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          Marquer en cours
                        </button>
                        <button
                          onClick={() => {
                            handleBulkStatusUpdate('pending')
                            setShowGroupedActions(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          Marquer en attente
                        </button>
                        <button
                          onClick={() => {
                            handleBulkStatusUpdate('delivered')
                            setShowGroupedActions(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          Marquer terminée
                        </button>
                        <button
                          onClick={() => {
                            handleBulkStatusUpdate('cancelled')
                            setShowGroupedActions(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          Marquer annulée
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            handleBulkDelete()
                            setShowGroupedActions(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Mettre à la corbeille
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowDateFilter(!showDateFilter)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    {selectedDateFilter === 'all' ? 'Toutes les dates' : selectedDateFilter}
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDateFilter && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedDateFilter('all')
                          setShowDateFilter(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          selectedDateFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        Toutes les dates
                      </button>
                      {getAvailableMonths().map((month, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedDateFilter(month)
                            setShowDateFilter(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            selectedDateFilter === month ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowChannelFilter(!showChannelFilter)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    {selectedChannelFilter === 'all' ? 'Tous les canaux de vente' : selectedChannelFilter}
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showChannelFilter && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          setSelectedChannelFilter('all')
                          setShowChannelFilter(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          selectedChannelFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        Tous les canaux de vente
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChannelFilter('Sur place')
                          setShowChannelFilter(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          selectedChannelFilter === 'Sur place' ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        Sur place
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChannelFilter('Emporter')
                          setShowChannelFilter(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          selectedChannelFilter === 'Emporter' ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        Emporter
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChannelFilter('Livraison')
                          setShowChannelFilter(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          selectedChannelFilter === 'Livraison' ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        Livraison
                      </button>
                    </div>
                  )}
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option>Filtrer par client enregistré</option>
                </select>
              </div>

              {/* Tableau des commandes */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders(filteredOrders.map(o => o._id))
                              } else {
                                setSelectedOrders([])
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Commande
                          <span className="ml-1 text-gray-400">↕</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Date
                          <span className="ml-1 text-gray-400">↕</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          État
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Total
                          <span className="ml-1 text-gray-400">↕</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Origine
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Chargement...
                          </td>
                        </tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Aucune commande
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const statusColor = getStatusColor(order.status)
                          const isInProgress = ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'on_the_way'].includes(order.status)
                          const isSelected = selectedOrders.includes(order._id)
                          
                          return (
                            <tr
                              key={order._id}
                              className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                const orderId = order._id
                                if (isSelected) {
                                  setSelectedOrders(selectedOrders.filter(id => id !== orderId))
                                } else {
                                  setSelectedOrders([...selectedOrders, orderId])
                                }
                              }}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    const orderId = order._id
                                    if (isSelected) {
                                      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
                                    } else {
                                      setSelectedOrders([...selectedOrders, orderId])
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOrderClick(order._id)
                                  }}
                                  className="text-blue-600 hover:underline font-medium text-sm"
                                >
                                  #{order._id.slice(-4)} {order.customerInfo?.name || 'Client'}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                                  isInProgress
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : statusColor.bg + ' ' + statusColor.text
                                }`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {order.totalAmount.toLocaleString('fr-FR')}CFA
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {order.orderType === 'sur_place' ? 'Sur place' : order.orderType === 'emporter' ? 'Emporter' : order.orderType === 'livraison' ? 'Livraison' : 'Direct'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {(order.orderType === 'livraison' && !order.assignedDeliveryId) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAssignDelivery(order._id)
                                      }}
                                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                                      title="Assigner un livreur"
                                    >
                                      Assigner livreur
                                    </button>
                                  )}
                                  {order.assignedDeliveryId && (
                                    <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs rounded-lg font-medium whitespace-nowrap">
                                      Assignée
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedNav === 'products' && (
            <div>
              {/* Header avec onglets et actions */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProductStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      productStatusFilter === 'all'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setProductStatusFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      productStatusFilter === 'active'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Actif
                  </button>
                  <button
                    onClick={() => setProductStatusFilter('draft')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      productStatusFilter === 'draft'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Brouillon
                  </button>
                  <button
                    onClick={() => setProductStatusFilter('archived')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      productStatusFilter === 'archived'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Archivé
                  </button>
                  <button className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tableau des produits */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(filteredProducts.map(p => p._id))
                              } else {
                                setSelectedProducts([])
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Statut
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Catégorie
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            Chargement...
                          </td>
                        </tr>
                      ) : filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            Aucun produit trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => {
                          const isSelected = selectedProducts.includes(product._id)
                          // Trouver la catégorie - gérer les ObjectId MongoDB
                          const productCategoryId = typeof product.categoryId === 'string' 
                            ? product.categoryId 
                            : product.categoryId?._id?.toString() || product.categoryId?.toString() || product.categoryId
                          const category = categories.find(c => {
                            const catId = c._id?.toString() || c._id
                            return catId === productCategoryId || catId?.toString() === productCategoryId?.toString()
                          })
                          
                          return (
                            <tr
                              key={product._id}
                              className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                const productId = product._id
                                if (isSelected) {
                                  setSelectedProducts(selectedProducts.filter(id => id !== productId))
                                } else {
                                  setSelectedProducts([...selectedProducts, productId])
                                }
                              }}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    const productId = product._id
                                    if (isSelected) {
                                      setSelectedProducts(selectedProducts.filter(id => id !== productId))
                                    } else {
                                      setSelectedProducts([...selectedProducts, productId])
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                  product.isAvailable
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.isAvailable ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {category?.name || 'Sans catégorie'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedNav === 'customers' && (
            <div>
              {/* Header avec actions */}
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Exporter
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Importer
                  </button>
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center gap-2">
                    Plus d'actions
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                    Ajouter un client
                  </button>
                </div>
              </div>

              {/* Barre de résumé */}
              <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{customers.length} clients</span>
                </div>
                <div className="text-sm text-gray-700">
                  <span>100 % de votre clientèle</span>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Rechercher des clients"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </button>
              </div>

              {/* Tableau des clients */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomers(filteredCustomers.map(c => c.id))
                              } else {
                                setSelectedCustomers([])
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Nom du/de la client(e)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Abonnement aux e-mails
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Emplacement
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Commandes
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Montant de la commande
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            Chargement...
                          </td>
                        </tr>
                      ) : filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            Aucun client trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((customer) => {
                          const isSelected = selectedCustomers.includes(customer.id)
                          const location = customer.address?.city
                            ? `${customer.address.city}${customer.address.zipCode ? `, ${customer.address.zipCode}` : ''}`
                            : customer.address?.zipCode || ''
                          const country = 'Sénégal' // Par défaut, à adapter selon les données
                          const fullLocation = location ? `${location}, ${country}` : ''
                          
                          return (
                            <tr
                              key={customer.id}
                              className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                const customerId = customer.id
                                if (isSelected) {
                                  setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
                                } else {
                                  setSelectedCustomers([...selectedCustomers, customerId])
                                }
                              }}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    const customerId = customer.id
                                    if (isSelected) {
                                      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
                                    } else {
                                      setSelectedCustomers([...selectedCustomers, customerId])
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">{customer.name || customer.email}</div>
                                  {customer.name && (
                                    <div className="text-gray-500 text-xs mt-1 truncate max-w-xs">
                                      {customer.email}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                  true // À adapter selon les données réelles
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {true ? 'Abonné' : 'Non abonné'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {fullLocation || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {customer.totalOrders || 0} {customer.totalOrders === 1 ? 'commande' : 'commandes'}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {(customer.totalAmount || 0).toLocaleString('fr-FR')} CFA
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredCustomers.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                      1-{Math.min(50, filteredCustomers.length)} sur {filteredCustomers.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedNav === 'analytics' && (
            <div>
              {/* Sous-navigation */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setAnalyticsTab('byDate')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    analyticsTab === 'byDate'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ventes par date
                </button>
                <button
                  onClick={() => setAnalyticsTab('byProduct')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    analyticsTab === 'byProduct'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ventes par produit
                </button>
                <button
                  onClick={() => setAnalyticsTab('byCategory')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    analyticsTab === 'byCategory'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ventes par catégorie
                </button>
                <button
                  onClick={() => setAnalyticsTab('promoCodes')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    analyticsTab === 'promoCodes'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Codes promo par date
                </button>
                <button
                  onClick={() => setAnalyticsTab('downloads')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    analyticsTab === 'downloads'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Téléchargements client
                </button>
              </div>

              {/* Filtres de date */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDateRange('year')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dateRange === 'year'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Année
                    </button>
                    <button
                      onClick={() => setDateRange('lastMonth')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dateRange === 'lastMonth'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Mois dernier
                    </button>
                    <button
                      onClick={() => setDateRange('thisMonth')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dateRange === 'thisMonth'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Ce mois
                    </button>
                    <button
                      onClick={() => setDateRange('last7Days')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dateRange === 'last7Days'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      7 derniers jours
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Personnalisé :</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      onClick={() => setDateRange('custom')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="yyyy-mm-dd"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      onClick={() => setDateRange('custom')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="yyyy-mm-dd"
                    />
                    <button 
                      onClick={() => {
                        if (customStartDate && customEndDate) {
                          setDateRange('custom')
                        }
                      }}
                      disabled={!customStartDate || !customEndDate}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        customStartDate && customEndDate
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Aller
                    </button>
                  </div>
                  <button 
                    onClick={handleExportCSV}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 ml-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exporter CSV
                  </button>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="flex gap-6">
                {/* Panneau gauche - KPIs */}
                <div className="w-80 bg-white rounded-lg border border-gray-200 p-6 max-h-[600px] overflow-y-auto">
                  <div className="space-y-4">
                    {/* Ventes brutes */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {getAnalyticsData().grossSales.toLocaleString('fr-FR')} CFA
                      </div>
                      <div className="text-sm text-gray-600">
                        de ventes brutes pour cette période
                      </div>
                    </div>

                    {/* Ventes nettes */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {getAnalyticsData().netSales.toLocaleString('fr-FR')} CFA
                      </div>
                      <div className="text-sm text-gray-600">
                        de ventes nettes pour cette période
                      </div>
                    </div>

                    {/* Commandes passées */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {getAnalyticsData().totalOrders}
                      </div>
                      <div className="text-sm text-gray-600">
                        commandes passées
                      </div>
                    </div>

                    {/* Articles achetés */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {getAnalyticsData().totalItems}
                      </div>
                      <div className="text-sm text-gray-600">
                        articles achetés
                      </div>
                    </div>

                    {/* Panier moyen */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {getAnalyticsData().averageCart.toLocaleString('fr-FR')} CFA
                      </div>
                      <div className="text-sm text-gray-600">
                        panier moyen
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone principale - Graphiques */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6 min-h-[600px]">
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-lg font-medium">Aucun graphique disponible</p>
                      <p className="text-sm mt-2">Les données seront affichées ici</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedNav === 'settings' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 text-base">Paramètres - Fonctionnalité en cours de développement</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {currentModal === 'assignDelivery' && <AssignDeliveryModal />}
      {currentModal === 'orderDetails' && <OrderDetailsModal />}
    </div>
  )
}
