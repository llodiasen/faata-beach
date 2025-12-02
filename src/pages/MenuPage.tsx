import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useModalStore } from '../store/useModalStore'
import { useCartStore } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'
import { getUserRole } from '../lib/permissions'
import { categoriesAPI, productsAPI } from '../lib/api'
import { getProductImage } from '../lib/productImages'
import BottomNavigation from '../components/layout/BottomNavigation'
import { CartModal } from '../components/modals/CartModal'
import { ProductDetailModal } from '../components/modals/ProductDetailModal'
import { OrderDetailsModal } from '../components/modals/OrderDetailsModal'
import { LoginModal } from '../components/auth/LoginModal'
import { useGeolocation } from '../hooks/useGeolocation'
import { LocationModal } from '../components/modals/LocationModal'
import { useFavoritesStore } from '../store/useFavoritesStore'
import { OrderTypeModal } from '../components/modals/OrderTypeModal'
import { ScheduleTimeModal } from '../components/modals/ScheduleTimeModal'

interface Category {
  _id: string
  name: string
  imageUrl?: string
}

type OrderType = 'sur_place' | 'reservation' | 'livraison'

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  categoryId?: any
  preparationTime?: number
  deliveryTime?: number
}

export default function MenuPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentModal, openModal, selectedCategory: storeSelectedCategory, setSelectedCategory: setStoreSelectedCategory, setSelectedProduct } = useModalStore()
  const { addItem, items, removeItem, getTotal, getItemCount } = useCartStore()
  const { user, logout } = useAuthStore()
  const userRole = getUserRole(user)
  const { address: geoAddress, getCurrentLocation } = useGeolocation()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [addressRefreshKey, setAddressRefreshKey] = useState(0)
  const [reservationDeliveryAddress, setReservationDeliveryAddress] = useState<string>('')
  const [showReservationAddressInput, setShowReservationAddressInput] = useState(false)
  const [reservationAddressInput, setReservationAddressInput] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cartNotification, setCartNotification] = useState<string | null>(null)
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [orderType, setOrderType] = useState<OrderType>('sur_place')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'livraison' | 'reservation'>('livraison')
  const [deliveryScheduledDateTime, setDeliveryScheduledDateTime] = useState<Date | null>(null)
  const [reservationDateTime, setReservationDateTime] = useState<Date | null>(null)
  const [reservationRefreshKey, setReservationRefreshKey] = useState(0)
  const categoriesScrollRef = useRef<HTMLDivElement | null>(null)
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const subtotal = getTotal()
  const serviceFee = items.length > 0 && orderType === 'livraison' ? 2000 : 0
  const total = subtotal + serviceFee

  const formatPrice = (price: number) => price.toLocaleString('fr-FR')

  // Détecter la catégorie depuis la navigation ou le store
  const isOrderType = (value: unknown): value is OrderType =>
    value === 'sur_place' || value === 'reservation' || value === 'livraison'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const routeState = (location.state || {}) as {
      orderType?: OrderType
      address?: string
      scheduledDateTime?: string | Date | null
      reservationDetails?: {
        guestCount?: number
        scheduledDateTime?: string | Date | null
      }
    }

    let resolvedType: OrderType | null = null
    if (routeState.orderType && isOrderType(routeState.orderType)) {
      resolvedType = routeState.orderType
    } else {
      const sessionValue = sessionStorage.getItem('faata_orderType')
      if (sessionValue && isOrderType(sessionValue)) {
        resolvedType = sessionValue
      } else {
        const localValue = localStorage.getItem('faata_orderType')
        if (localValue && isOrderType(localValue)) {
          resolvedType = localValue
        }
      }
    }

    const finalType: OrderType = resolvedType || 'sur_place'
    setOrderType(finalType)
    sessionStorage.setItem('faata_orderType', finalType)
    localStorage.setItem('faata_orderType', finalType)

    if (routeState.address) {
      let existingAddress: Record<string, unknown> = {}
      try {
        const stored = localStorage.getItem('faata_deliveryAddress')
        existingAddress = stored ? JSON.parse(stored) : {}
      } catch {
        existingAddress = {}
      }
      const updatedAddress = {
        ...existingAddress,
        fullAddress: routeState.address,
        scheduledDateTime: routeState.scheduledDateTime || existingAddress.scheduledDateTime || null,
      }
      const serialized = JSON.stringify(updatedAddress)
      localStorage.setItem('faata_deliveryAddress', serialized)
      sessionStorage.setItem('faata_deliveryAddress', serialized)
    } else if (!sessionStorage.getItem('faata_deliveryAddress')) {
      const localAddress = localStorage.getItem('faata_deliveryAddress')
      if (localAddress) {
        sessionStorage.setItem('faata_deliveryAddress', localAddress)
      }
    }

    if (routeState.reservationDetails) {
      const serialized = JSON.stringify(routeState.reservationDetails)
      localStorage.setItem('faata_reservationDetails', serialized)
      sessionStorage.setItem('faata_reservationDetails', serialized)
    } else if (!sessionStorage.getItem('faata_reservationDetails')) {
      const localReservation = localStorage.getItem('faata_reservationDetails')
      if (localReservation) {
        sessionStorage.setItem('faata_reservationDetails', localReservation)
      }
    }
  }, [location.state])

  useEffect(() => {
    const categoryId = (location.state as any)?.categoryId || storeSelectedCategory
    if (categoryId && categoryId !== selectedCategory) {
      setSelectedCategory(categoryId)
      setStoreSelectedCategory(categoryId)
    }
  }, [location.state, storeSelectedCategory])

  // Charger l'adresse de livraison pour réservation depuis localStorage
  useEffect(() => {
    if (orderType === 'reservation') {
      const savedAddress = localStorage.getItem('faata_reservationDeliveryAddress')
      if (savedAddress) {
        setReservationDeliveryAddress(savedAddress)
      }
    }
  }, [orderType])

  // Désactiver le scroll sur le body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[MenuPage] Fetching categories and products...')
        const [categoriesData, productsData] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll()
        ])
        
        console.log('[MenuPage] Categories received:', categoriesData?.length || 0)
        console.log('[MenuPage] Products received:', productsData?.length || 0)
        
        setCategories(categoriesData)
        setAllProducts(productsData)
        setFilteredProducts(productsData)
      } catch (err) {
        console.error('[MenuPage] Error fetching data:', err)
      }
    }

    fetchData()
  }, [])

  // Filtrer les produits selon la catégorie sélectionnée
  useEffect(() => {
    console.log('[MenuPage] Filtering products. selectedCategory:', selectedCategory, 'allProducts:', allProducts.length)
    if (selectedCategory) {
      // Filtrer par categoryId
      const filtered = allProducts.filter(product => {
        const productCategoryId = typeof product.categoryId === 'object' 
          ? product.categoryId?._id?.toString() 
          : product.categoryId?.toString()
        return productCategoryId === selectedCategory
      })
      console.log('[MenuPage] Filtered products count:', filtered.length)
      setFilteredProducts(filtered)
    } else {
      console.log('[MenuPage] No category selected, showing all products:', allProducts.length)
      setFilteredProducts(allProducts)
    }
  }, [selectedCategory, allProducts])


  const handleProductClick = (productId: string) => {
    if (productId) {
      setSelectedProduct(productId)
      openModal('productDetail')
    }
  }

  const playCartSound = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const audioCtx = audioContextRef.current
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
      const createNote = (frequency: number, startTime: number, duration: number, type: OscillatorType = 'triangle') => {
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()

        oscillator.type = type
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime)

        gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime + startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + startTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startTime + duration)

        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        oscillator.start(audioCtx.currentTime + startTime)
        oscillator.stop(audioCtx.currentTime + startTime + duration)
      }

      // double ding type notification iOS
      createNote(1200, 0, 0.12, 'triangle')
      createNote(900, 0.12, 0.18, 'sine')
    } catch (error) {
      console.error('Unable to play cart sound', error)
    }
  }

  const showCartNotification = (message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    setCartNotification(message)
    notificationTimeoutRef.current = setTimeout(() => {
      setCartNotification(null)
    }, 2200)
  }


  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Fonction pour détecter la géolocalisation
  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    try {
      const addressData = await getCurrentLocation()
      const updatedAddress = {
        ...addressData,
        scheduledDateTime: null
      }
      localStorage.setItem('faata_deliveryAddress', JSON.stringify(updatedAddress))
      sessionStorage.setItem('faata_deliveryAddress', JSON.stringify(updatedAddress))
      // Forcer le re-render de l'adresse
      setAddressRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Erreur géolocalisation:', error)
    } finally {
      setDetectingLocation(false)
    }
  }



  const handleQuickAdd = (e: MouseEvent<HTMLButtonElement>, product: Product) => {
    e.stopPropagation()
    e.preventDefault()
    const imageUrl = getProductImage(product)
    const itemToAdd = {
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl,
    }
    addItem(itemToAdd, 1)
    showCartNotification(`${product.name} ajouté au panier`)
    playCartSound()
    // Feedback visuel : le badge du panier sera mis à jour automatiquement
  }


  const handleCheckout = () => {
    if (items.length === 0) return
    navigate('/checkout')
  }

  // Fonction pour gérer le changement de type de commande depuis le modal
  const handleOrderTypeChange = (type: OrderType, data?: {
    reservationGuests?: number
    reservationDateTime?: Date | null
    deliveryAddress?: string
    deliveryScheduledDateTime?: Date | null
  }) => {
    // Mettre à jour le type de commande
    setOrderType(type)
    localStorage.setItem('faata_orderType', type)
    sessionStorage.setItem('faata_orderType', type)

    // Nettoyer les données du mode précédent si on change de mode
    if (type !== 'livraison') {
      // Si on passe à sur_place ou reservation, nettoyer l'adresse de livraison
      localStorage.removeItem('faata_deliveryAddress')
      sessionStorage.removeItem('faata_deliveryAddress')
      setDeliveryScheduledDateTime(null)
    }
    if (type !== 'reservation') {
      // Si on passe à sur_place ou livraison, nettoyer les détails de réservation
      localStorage.removeItem('faata_reservationDetails')
      sessionStorage.removeItem('faata_reservationDetails')
      setReservationDateTime(null)
    }
    if (type !== 'sur_place') {
      // Si on passe à reservation ou livraison, pas besoin de nettoyer (pas de données spécifiques)
    }

    // Mettre à jour les données selon le nouveau type
    if (type === 'reservation' && data?.reservationGuests !== undefined && data?.reservationDateTime) {
      const reservationData = {
        guestCount: data.reservationGuests,
        scheduledDateTime: data.reservationDateTime ? data.reservationDateTime.toISOString() : null
      }
      localStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
      sessionStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
      // Mettre à jour l'état local
      setReservationDateTime(data.reservationDateTime)
      // Forcer le re-render
      setReservationRefreshKey(prev => prev + 1)
    }

    if (type === 'livraison' && data?.deliveryAddress) {
      const addressData = {
        fullAddress: data.deliveryAddress,
        scheduledDateTime: data.deliveryScheduledDateTime ? data.deliveryScheduledDateTime.toISOString() : null
      }
      localStorage.setItem('faata_deliveryAddress', JSON.stringify(addressData))
      sessionStorage.setItem('faata_deliveryAddress', JSON.stringify(addressData))
      // Mettre à jour l'état local
      if (data.deliveryScheduledDateTime) {
        setDeliveryScheduledDateTime(data.deliveryScheduledDateTime)
      }
      // Forcer le re-render
      setAddressRefreshKey(prev => prev + 1)
    }
  }

  const getDeliveryAddress = (): string => {
    // Utiliser addressRefreshKey pour forcer le re-render
    void addressRefreshKey
    
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const address = JSON.parse(savedAddress)
        return address.fullAddress || ''
      } catch (e) {
        return ''
      }
    }
    return geoAddress?.fullAddress || 'Adresse non définie'
  }

  const getReservationDetails = () => {
    // Utiliser reservationRefreshKey pour forcer le re-render
    void reservationRefreshKey
    if (typeof window === 'undefined') return null
    const saved =
      sessionStorage.getItem('faata_reservationDetails') ||
      localStorage.getItem('faata_reservationDetails')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch (error) {
      return null
    }
  }

  const formatReservationDate = (value?: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
    const day = date.getDate()
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long' })
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    // Capitaliser la première lettre du jour et du mois
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1)
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    return `${capitalizedDayName} ${day} ${capitalizedMonthName} ${year} à ${hours}:${minutes}`
  }

  const renderProductImage = (product: Product) => {
    const imageSrc = getProductImage(product)

    if (imageSrc) {
      return (
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent && !parent.querySelector('.image-fallback')) {
              const fallback = document.createElement('div')
              fallback.className = 'image-fallback w-full h-full bg-gradient-to-br from-[#39512a]/10 via-[#2f2e2e]/5 to-[#39512a]/10 flex items-center justify-center'
              fallback.innerHTML = `<div class="text-center p-4"><div class="text-5xl mb-2">🍽️</div><div class="text-xs text-gray-600 font-medium">${product.name}</div></div>`
              parent.appendChild(fallback)
            }
          }}
        />
      )
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-[#39512a]/10 via-[#2f2e2e]/5 to-[#39512a]/10 flex items-center justify-center image-fallback p-4">
        <div className="text-center p-4">
          <div className="text-5xl mb-2">🍽️</div>
          <div className="text-xs text-gray-600 font-medium">{product.name}</div>
        </div>
      </div>
    )
  }

  const getCategoryLabel = (product: Product): string => {
    let categoryName = 'Menu'
    if (typeof product.categoryId === 'object' && product.categoryId?.name) {
      categoryName = product.categoryId.name
    } else {
      const category = categories.find((c) => c._id === product.categoryId)
      categoryName = category?.name || 'Menu'
    }
    // Enlever "Plats —" du nom de catégorie
    return categoryName.replace(/^Plats —\s*/, '')
  }

  // Fonction pour obtenir l'emoji d'une catégorie
  const getCategoryEmoji = (categoryName: string): string => {
    const emojiMap: Record<string, string> = {
      'Entrées': '🥗',
      'Plats': '🍽️',
      'Plats — À base de poisson': '🐟',
      'Plats — À base de fruits de mer': '🦐',
      'Plats — À base de poulet': '🍗',
      'Plats — À base de viande': '🥩',
      'Accompagnements': '🍟',
      'Boissons': '🥤',
      'Desserts': '🍰',
      'Pizzas': '🍕'
    }
    return emojiMap[categoryName] || '🍽️'
  }

  // Catégories avec produits représentatifs
  const getDisplayCategories = () => {
    // Mapper les noms de catégories pour trouver les produits représentatifs
    const categoryMapping: Record<string, { name: string; bgColor: string; productKeywords: string[] }> = {
      'Entrées': {
        name: 'Entrées',
        bgColor: 'bg-green-50',
        productKeywords: ['salade', 'niçoise', 'chef', 'italienne', 'exotique', 'chinoise', 'cocktail', 'avocat', 'œuf', 'mimosa', 'crevette', 'soupe']
      },
      'Plats': {
        name: 'Plats',
        bgColor: 'bg-blue-50',
        productKeywords: ['salade', 'césar', 'brochette', 'lotte', 'viande', 'bœuf', 'côte']
      },
      'Plats — À base de poisson': {
        name: 'Poissons',
        bgColor: 'bg-blue-50',
        productKeywords: ['lotte', 'poisson', 'braisé', 'sole', 'meunière', 'colbert', 'filet']
      },
      'Plats — À base de fruits de mer': {
        name: 'Fruits de mer',
        bgColor: 'bg-cyan-50',
        productKeywords: ['crevettes', 'gambas', 'fruits de mer']
      },
      'Plats — À base de poulet': {
        name: 'Poulet',
        bgColor: 'bg-orange-50',
        productKeywords: ['poulet', 'cordon', 'bleu']
      },
      'Plats — À base de viande': {
        name: 'Viandes',
        bgColor: 'bg-red-50',
        productKeywords: ['steak', 'bœuf', 'émincé', 'ragout', 'ragôt']
      },
      'Accompagnements': {
        name: 'Accompagnements',
        bgColor: 'bg-yellow-50',
        productKeywords: ['riz', 'frites', 'légumes', 'pommes', 'spaghetti', 'gratin', 'dauphinois']
      },
      'Boissons': {
        name: 'Boissons',
        bgColor: 'bg-cyan-50',
        productKeywords: ['cocktail', 'mojito', 'coca', 'sprite', 'fanta', 'bissap', 'bouye', 'gingembre', 'bière', 'gazelle', 'flag', 'café', 'thé']
      },
      'Desserts': {
        name: 'Desserts',
        bgColor: 'bg-pink-50',
        productKeywords: ['glace', 'fondant', 'chocolat', 'tarte', 'mousse', 'banane', 'flambée', 'crêpe', 'fruits']
      },
      'Pizzas': {
        name: 'Pizzas',
        bgColor: 'bg-orange-50',
        productKeywords: ['pizza', 'reine', 'oriental', 'fromage', 'viande']
      }
    }

    return categories
      .filter(cat => categoryMapping[cat.name] || true) // Afficher toutes les catégories
      .map(cat => {
        const mapping = categoryMapping[cat.name] || {
          name: cat.name,
          bgColor: 'bg-gray-50',
          productKeywords: []
        }
        // Trouver un produit représentatif pour cette catégorie
        const representativeProduct = allProducts.find(product => {
          const productCategoryId = typeof product.categoryId === 'object' 
            ? product.categoryId?._id?.toString() 
            : product.categoryId?.toString()
          if (productCategoryId === cat._id) {
            // Si le produit appartient à la catégorie, vérifier aussi les mots-clés pour un meilleur match
            if (mapping.productKeywords.length > 0) {
              const productName = product.name.toLowerCase()
              return mapping.productKeywords.some(keyword => productName.includes(keyword))
            }
            return true
          }
          return false
        }) || allProducts.find(product => {
          const productCategoryId = typeof product.categoryId === 'object' 
            ? product.categoryId?._id?.toString() 
            : product.categoryId?.toString()
          return productCategoryId === cat._id
        })

        return {
          id: cat._id,
          name: mapping.name,
          bgColor: mapping.bgColor,
          categoryId: cat._id,
          representativeProduct,
          imageUrl: representativeProduct ? getProductImage(representativeProduct) : '',
          emoji: getCategoryEmoji(cat.name)
        }
      })
  }

  // Composant bouton favoris
  const FavoriteButton = ({ product }: { product: Product }) => {
    const isFavorite = useFavoritesStore((state) => state.isFavorite(product._id))
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          const { toggleFavorite } = useFavoritesStore.getState()
          const favoriteItem = {
            productId: product._id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            description: product.description
          }
          toggleFavorite(favoriteItem)
        }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-10"
        aria-label="Ajouter aux favoris"
      >
        {isFavorite ? (
          <svg className="w-4 h-4 text-[#39512a]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>
    )
  }

  const renderProductCard = (product: Product, variant: 'popular' | 'default') => {
    const rating = 4.7 + (product.price % 3) * 0.05

  return (
      <div
        key={`${variant}-${product._id}`}
        className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
        onClick={() => handleProductClick(product._id)}
      >
        <div className="relative h-48 bg-white overflow-hidden">
          {renderProductImage(product)}

          <FavoriteButton product={product} />
        </div>

        <div className="p-3 flex flex-col flex-1">
          {/* Nom et catégorie sur la même ligne */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#39512a] truncate">{product.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{getCategoryLabel(product)}</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z" />
              </svg>
              <span className="text-xs font-normal text-[#39512a]">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Prix et temps de préparation */}
          <div className="mb-2 space-y-1">
            <div>
              <span className="text-base font-medium text-[#39512a]">{formatPrice(product.price)} FCFA</span>
            </div>
            {product.preparationTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{product.preparationTime} min</span>
              </div>
            )}
          </div>

          {/* Bouton Ajouter panier */}
          <button
            onClick={(e) => handleQuickAdd(e, product)}
            className="w-full bg-[#39512a] hover:opacity-90 text-white py-2 rounded-lg font-normal text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter panier
          </button>
        </div>
      </div>
    )
  }

  const reservationDetails = getReservationDetails()

  const pickupInfo =
    orderType === 'sur_place'
      ? {
          title: 'Sur place',
          description: 'Consommation directe dans le restaurant. Prévenez-nous si vous avez besoin d’une table.',
        }
      : orderType === 'reservation'
        ? {
            title: 'Réservation table',
            description: reservationDetails && reservationDetails.guestCount
              ? `Pour ${reservationDetails.guestCount} personne${reservationDetails.guestCount > 1 ? 's' : ''} — ${formatReservationDate(reservationDetails.scheduledDateTime)}`
              : reservationDetails && reservationDetails.scheduledDateTime
                ? `Réservation — ${formatReservationDate(reservationDetails.scheduledDateTime)}`
                : 'Réservation en cours. Merci de confirmer votre créneau.',
          }
        : {
            title: 'À emporter',
            description: 'Nous préparons votre commande pour un retrait rapide au comptoir.',
  }

  const orderSummaryContent = (
    <div className="flex flex-col h-full">
      {/* Section fixe en haut - Adresse */}
      <div className="mb-6 flex-shrink-0">
        {orderType === 'livraison' ? (
          <>
            <h3 className="text-sm font-normal text-gray-500 mb-2">Adresse de livraison</h3>
            <p className="text-base font-semibold text-[#39512a] mb-3 break-words">{getDeliveryAddress()}</p>
            
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="flex-1 bg-[#39512a] hover:opacity-90 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {detectingLocation ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Détection...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                    </svg>
                    Détecter position
                  </>
                )}
              </button>
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex-1 bg-[#39512a]/10 hover:bg-[#39512a]/20 text-[#39512a] py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Changer l'adresse
              </button>
            </div>
            <button
              onClick={() => openModal('orderType')}
              className="w-full text-xs font-semibold text-[#39512a] hover:underline text-center"
            >
              Modifier
            </button>
          </>
        ) : (
          <>
            <h3 className="text-sm font-normal text-gray-500 mb-2">Mode de commande</h3>
            <div className="bg-[#f6f6f6] border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-[#39512a]">{pickupInfo.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{pickupInfo.description}</p>
                </div>
                <button
                  onClick={() => openModal('orderType')}
                  className="text-xs font-semibold text-[#39512a] hover:underline whitespace-nowrap"
                >
                  Modifier
                </button>
              </div>
              
              {/* Section adresse de livraison pour réservation */}
              {orderType === 'reservation' && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  {reservationDeliveryAddress ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Adresse de livraison</p>
                        <p className="text-sm font-semibold text-[#39512a] break-words">{reservationDeliveryAddress}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowReservationAddressInput(true)
                            setReservationAddressInput(reservationDeliveryAddress)
                          }}
                          className="flex-1 bg-[#39512a]/10 hover:bg-[#39512a]/20 text-[#39512a] py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setReservationDeliveryAddress('')
                            localStorage.removeItem('faata_reservationDeliveryAddress')
                          }}
                          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : showReservationAddressInput ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={reservationAddressInput}
                        onChange={(e) => setReservationAddressInput(e.target.value)}
                        placeholder="Saisir l'adresse de livraison"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (reservationAddressInput.trim()) {
                              setReservationDeliveryAddress(reservationAddressInput.trim())
                              localStorage.setItem('faata_reservationDeliveryAddress', reservationAddressInput.trim())
                            }
                            setShowReservationAddressInput(false)
                            setReservationAddressInput('')
                          }}
                          className="flex-1 bg-[#39512a] hover:opacity-90 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => {
                            setShowReservationAddressInput(false)
                            setReservationAddressInput('')
                          }}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReservationAddressInput(true)}
                      className="w-full bg-[#39512a]/10 hover:bg-[#39512a]/20 text-[#39512a] py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Livrer à une autre adresse
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Section scrollable - Liste des items */}
      <div className="mb-6 flex flex-col flex-1 min-h-0 lg:min-h-auto">
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <h3 className="text-lg font-medium text-[#39512a]">Ma commande</h3>
          {getItemCount() > 0 && (
            <span className="bg-[#39512a] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {getItemCount()}
            </span>
          )}
        </div>
        {/* Sur mobile: scroll avec maxHeight, sur desktop: scroll seulement si plus de 3 éléments */}
        <div 
          className={`space-y-2 flex-1 overflow-x-hidden min-h-0 lg:pr-2 ${
            items.length > 3 
              ? 'overflow-y-auto lg:max-h-[calc(100vh-500px)]' 
              : 'overflow-y-visible lg:overflow-visible'
          }`}
          style={items.length <= 3 ? {} : { maxHeight: 'calc(100vh - 400px)' }}
        >
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Votre panier est vide</p>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="relative flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 flex-shrink-0">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition-colors z-10"
                    aria-label="Retirer l'article"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative" style={{ minWidth: '64px', minHeight: '64px' }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent && !parent.querySelector('.image-fallback')) {
                            const fallback = document.createElement('div')
                            fallback.className = 'image-fallback w-full h-full flex items-center justify-center text-xl absolute inset-0 bg-gray-100'
                            fallback.innerHTML = '🍽️'
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl absolute inset-0 bg-gray-100">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#39512a] truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">x{item.quantity}</p>
                  </div>
                  <div className="text-sm font-semibold text-[#39512a] text-right min-w-[80px] flex-shrink-0">
                    {formatPrice(item.price * item.quantity)} FCFA
                  </div>
                </div>
              ))}
              {/* Total dans la section scrollable */}
              <div className="pt-3 border-t border-gray-200 mt-2 flex-shrink-0">
                <div className="space-y-2 text-sm text-gray-600">
                  {orderType === 'livraison' && serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span>Livraison</span>
                      <span className="text-[#39512a] font-medium">{formatPrice(serviceFee)} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold text-[#39512a] pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatPrice(total)} FCFA</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section fixe en bas - Boutons */}
      {items.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 pt-4 space-y-4">

          <button className="w-full bg-[#39512a]/10 hover:bg-[#39512a]/20 text-[#39512a] py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-between">
            <span>Vous avez un code promo ?</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleCheckout}
            className="w-full bg-[#39512a] hover:opacity-90 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all"
          >
            Valider la commande
          </button>
        </div>
      )}
    </div>
  )

  const displayCategories = getDisplayCategories()

  // Auto-scroll des catégories sur mobile
  useEffect(() => {
    // Vérifier si on est sur mobile (largeur < 768px)
    const checkMobile = () => window.innerWidth < 768
    if (!checkMobile() || !categoriesScrollRef.current || displayCategories.length === 0) return

    const scrollContainer = categoriesScrollRef.current
    
    const scrollToNext = () => {
      if (!scrollContainer) return
      
      // Obtenir la position de scroll actuelle
      const currentScroll = scrollContainer.scrollLeft
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth
      
      // Si on est à la fin (ou presque), revenir au début
      if (currentScroll >= maxScroll - 5) {
        scrollContainer.scrollTo({
          left: 0,
          behavior: 'smooth'
        })
      } else {
        // Sinon, scroller vers la droite d'environ 1/3 de la largeur visible
        const scrollAmount = scrollContainer.clientWidth / 3
        scrollContainer.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        })
      }
    }

    // Démarrer l'auto-scroll toutes les 3 secondes
    autoScrollIntervalRef.current = setInterval(scrollToNext, 3000)

    // Nettoyer l'intervalle au démontage
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
        autoScrollIntervalRef.current = null
      }
    }
  }, [displayCategories])

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Header simplifié */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center flex-shrink-0">
              <img src="/images/logo.png" alt="FAATA BEACH" className="h-16 md:h-16 lg:h-20" />
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              {/* Icône panier */}
              <button
                onClick={() => openModal('cart')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Panier"
              >
                <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getItemCount() > 0 && (
                  <span className="absolute top-0 right-0 bg-[#39512a] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
              
              {/* Icône profil */}
              <button
                onClick={() => navigate('/login')}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Se connecter"
              >
                <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
                </svg>
              </button>

              {/* Menu hamburger */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-8 h-8 md:w-6 md:h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
                  </div>
                </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Catégories - Design style pills horizontal - Pleine largeur */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-4 md:py-6 mb-2">
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg md:text-xl font-bold text-[#39512a]">Menu</h2>
              <button 
                onClick={() => {
                  setSelectedCategory(null)
                  setStoreSelectedCategory(null)
                }}
                className="text-sm text-[#121212] hover:text-[#39512a] transition-colors"
              >
                Voir tout
              </button>
            </div>

            {/* Boutons catégories horizontaux - Desktop et Mobile */}
            <div 
              ref={categoriesScrollRef}
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full md:overflow-x-visible"
            >
              <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              
              {/* Catégories */}
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.categoryId)
                    setStoreSelectedCategory(cat.categoryId)
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
                    selectedCategory === cat.categoryId
                      ? 'bg-[#39512a] text-white'
                      : 'bg-white text-[#121212] border border-[#39512a]'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="w-full px-4 md:px-8 lg:px-12 py-4">
          <div className="w-full max-w-[1400px] mx-auto">

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Colonne gauche - Produits */}
            <div className="flex-1 space-y-10">
              {/* Produits filtrés par catégorie */}
              {selectedCategory && filteredProducts.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-[#39512a] mb-4">
                    {(() => {
                      const category = categories.find(c => c._id === selectedCategory)
                      if (!category) return ''
                      const categoryMapping: Record<string, string> = {
                        'Entrées': 'Entrées',
                        'Plats': 'Plats',
                        'Plats — À base de poisson': 'Poissons',
                        'Plats — À base de fruits de mer': 'Fruits de mer',
                        'Plats — À base de poulet': 'Poulet',
                        'Plats — À base de viande': 'Viandes',
                        'Accompagnements': 'Accompagnements',
                        'Boissons': 'Boissons',
                        'Desserts': 'Desserts',
                        'Pizzas': 'Pizzas'
                      }
                      return categoryMapping[category.name] || category.name.replace('Plats — ', '')
                    })()}
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
                    {filteredProducts.map((product) => renderProductCard(product, 'default'))}
                  </div>
                </section>
              )}

              {/* Tous les produits si aucune catégorie sélectionnée */}
              {!selectedCategory && filteredProducts.length > 0 && (
                <section>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
                    {filteredProducts.map((product) => renderProductCard(product, 'default'))}
                  </div>
                </section>
              )}

              {/* Message si aucun produit */}
              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">Aucun produit trouvé</p>
                  <p className="text-sm text-gray-400 mt-2">
                    selectedCategory: {selectedCategory || 'null'}, 
                    allProducts: {allProducts.length}, 
                    filteredProducts: {filteredProducts.length}
                  </p>
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-700 text-base font-normal mb-2">Aucun produit trouvé</p>
                  <p className="text-gray-500 text-base">Essayez de modifier vos filtres ou votre recherche</p>
                  {selectedCategory && (
        <button
                      onClick={() => {
                        setSelectedCategory(null)
                        setStoreSelectedCategory(null)
                      }}
                      className="mt-4 px-3 py-2 bg-[#39512a] text-white rounded-full font-medium hover:opacity-90 transition-colors text-sm"
                    >
                      Réinitialiser les filtres
        </button>
      )}
                </div>
              )}
            </div>

            {/* Sidebar droite - My Order */}
            <aside className="hidden lg:block w-full lg:max-w-[360px] bg-white/95 border border-gray-200 rounded-2xl p-6 shadow-xl lg:h-auto lg:max-h-[calc(100vh-140px)] flex flex-col">
              {orderSummaryContent}
            </aside>
          </div>

        {/* Récapitulatif mobile */}
        <div className="lg:hidden mt-10 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          {orderSummaryContent}
        </div>
          </div>
        </div>
      </div>

      {/* Menu modal - Mobile et Desktop */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#39512a]">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                  aria-label="Fermer le menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Menu items */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.414 12.414l-3.172-3.172a5 5 0 00-7.07 7.07l3.172 3.172m0 0l3.172 3.172m-3.172-3.172L6.343 6.343" />
                    </svg>
                    <span>Nous trouver</span>
                  </button>

                  {/* Switcher de langue */}
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 py-2">
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
                  <div className="border-t border-gray-200 my-2"></div>

                  {user ? (
                    <>
                      {userRole === 'admin' || userRole === 'delivery' || userRole === 'customer' ? (
                        <button
                          onClick={() => {
                            setShowMobileMenu(false)
                            if (userRole === 'admin') {
                              navigate('/dashboard-admin')
                            } else if (userRole === 'delivery') {
                              navigate('/dashboard-livreur')
                            } else {
                              navigate('/profile')
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>
                            {userRole === 'admin' ? 'Dashboard Admin' : userRole === 'delivery' ? 'Dashboard Livreur' : 'Mon Profil'}
                          </span>
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          navigate('/profile')
                        }}
                        className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Mon Profil</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          logout()
                          navigate('/')
                        }}
                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Déconnexion</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          navigate('/login')
                        }}
                        className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Se connecter</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          navigate('/register')
                        }}
                        className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>S'inscrire</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <CartModal />
      <ProductDetailModal />
      <OrderDetailsModal />
      {currentModal === 'login' && <LoginModal />}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={() => {
          setShowLocationModal(false)
          // Forcer le re-render de l'adresse
          setAddressRefreshKey(prev => prev + 1)
        }}
      />
      <OrderTypeModal
        currentOrderType={orderType}
        onOrderTypeChange={handleOrderTypeChange}
        onScheduleModeChange={setScheduleMode}
      />
      {currentModal === 'scheduleTime' && (
        <ScheduleTimeModal
          value={scheduleMode === 'livraison' ? deliveryScheduledDateTime : reservationDateTime}
          onChange={(date) => {
            if (scheduleMode === 'livraison') {
              setDeliveryScheduledDateTime(date)
              // Sauvegarder dans localStorage pour la livraison
              const savedAddress = localStorage.getItem('faata_deliveryAddress')
              if (savedAddress) {
                try {
                  const addressData = JSON.parse(savedAddress)
                  addressData.scheduledDateTime = date ? date.toISOString() : null
                  localStorage.setItem('faata_deliveryAddress', JSON.stringify(addressData))
                  sessionStorage.setItem('faata_deliveryAddress', JSON.stringify(addressData))
                  setAddressRefreshKey(prev => prev + 1)
                } catch (e) {
                  console.error('Erreur sauvegarde date livraison:', e)
                }
              }
              } else {
                setReservationDateTime(date)
                // Sauvegarder dans localStorage pour la réservation
                const savedReservation = localStorage.getItem('faata_reservationDetails')
                if (savedReservation) {
                  try {
                    const reservationData = JSON.parse(savedReservation)
                    reservationData.scheduledDateTime = date ? date.toISOString() : null
                    localStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
                    sessionStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
                    setReservationRefreshKey(prev => prev + 1)
                  } catch (e) {
                    console.error('Erreur sauvegarde date réservation:', e)
                  }
                } else {
                  // Si pas de réservation sauvegardée, créer une nouvelle
                  const reservationData = {
                    guestCount: 2,
                    scheduledDateTime: date ? date.toISOString() : null
                  }
                  localStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
                  sessionStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
                  setReservationRefreshKey(prev => prev + 1)
                }
              }
          }}
        />
      )}
      
      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />

      {/* Notification ajout panier */}
      <div
        aria-live="polite"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
          cartNotification ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {cartNotification && (
          <div className="flex items-center gap-2 bg-[#39512a] text-white px-4 py-2 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{cartNotification}</span>
          </div>
        )}
      </div>
    </div>
  )
}
