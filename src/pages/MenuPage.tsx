import { useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useModalStore } from '../store/useModalStore'
import { useCartStore } from '../store/useCartStore'
import { categoriesAPI, productsAPI } from '../lib/api'
import { getProductImage } from '../lib/productImages'
import BottomNavigation from '../components/layout/BottomNavigation'
import { CartModal } from '../components/modals/CartModal'
import { ProductDetailModal } from '../components/modals/ProductDetailModal'
import { useGeolocation } from '../hooks/useGeolocation'
import { LocationModal } from '../components/modals/LocationModal'

interface Category {
  _id: string
  name: string
  imageUrl?: string
}

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
  const { openModal, selectedCategory: storeSelectedCategory, setSelectedCategory: setStoreSelectedCategory, setSelectedProduct } = useModalStore()
  const { addItem, items, updateQuantity, removeItem, getTotal, getItemCount } = useCartStore()
  const { address: geoAddress } = useGeolocation()
  const [showLocationModal, setShowLocationModal] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  const categoryIcons: Record<string, string> = {
    'Entrées': '🥗',
    'Plats — À base de poisson': '🐟',
    'Plats — À base de fruits de mer': '🍤',
    'Plats — À base de poulet': '🍗',
    'Plats — À base de viande': '🥩',
    'Accompagnements': '🍟',
    'Boissons': '🥤',
    'Desserts': '🍰'
  }

  const popularProducts = useMemo(() => filteredProducts.slice(0, 6), [filteredProducts])
  const subtotal = getTotal()
  const serviceFee = items.length > 0 ? 2000 : 0
  const total = subtotal + serviceFee

  const formatPrice = (price: number) => price.toLocaleString('fr-FR')

  // Détecter la catégorie depuis la navigation ou le store
  useEffect(() => {
    const categoryId = (location.state as any)?.categoryId || storeSelectedCategory
    if (categoryId && categoryId !== selectedCategory) {
      setSelectedCategory(categoryId)
      setStoreSelectedCategory(categoryId)
    }
  }, [location.state, storeSelectedCategory])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll()
        ])
        
        setCategories(categoriesData)
        setAllProducts(productsData)
        setFilteredProducts(productsData)
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [])

  // Filtrer les produits selon la catégorie sélectionnée
  useEffect(() => {
    if (selectedCategory) {
      const filtered = allProducts.filter(product => {
        const productCategoryId = typeof product.categoryId === 'object' 
          ? product.categoryId?._id?.toString() 
          : product.categoryId?.toString()
        return productCategoryId === selectedCategory
      })
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(allProducts)
    }
  }, [selectedCategory, allProducts])

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null)
      setStoreSelectedCategory(null)
    } else {
      setSelectedCategory(categoryId)
      setStoreSelectedCategory(categoryId)
    }
  }

  const handleProductClick = (productId: string) => {
    if (productId) {
      setSelectedProduct(productId)
      openModal('productDetail')
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
    // Feedback visuel : le badge du panier sera mis à jour automatiquement
  }

  const handleIncrease = (id: string, quantity: number) => {
    updateQuantity(id, quantity + 1)
  }

  const handleDecrease = (id: string, quantity: number) => {
    updateQuantity(id, Math.max(1, quantity - 1))
  }

  const handleCheckout = () => {
    if (items.length === 0) return
    navigate('/checkout')
  }

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
    return geoAddress?.fullAddress || 'Adresse non définie'
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
              fallback.className = 'image-fallback w-full h-full bg-gradient-to-br from-pink-100 via-purple-50 to-pink-200 flex items-center justify-center'
              fallback.innerHTML = `<div class="text-center p-4"><div class="text-5xl mb-2">🍽️</div><div class="text-xs text-gray-600 font-medium">${product.name}</div></div>`
              parent.appendChild(fallback)
            }
          }}
        />
      )
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-pink-100 via-purple-50 to-pink-200 flex items-center justify-center image-fallback">
        <div className="text-center p-4">
          <div className="text-5xl mb-2">🍽️</div>
          <div className="text-xs text-gray-600 font-medium">{product.name}</div>
        </div>
      </div>
    )
  }

  const getCategoryLabel = (product: Product): string => {
    if (typeof product.categoryId === 'object' && product.categoryId?.name) {
      return product.categoryId.name
    }
    const category = categories.find((c) => c._id === product.categoryId)
    return category?.name || 'Menu'
  }

  const renderProductCard = (product: Product, variant: 'popular' | 'default') => {
    const priceLevel = product.price > 8000 ? '$$$' : product.price > 5000 ? '$$' : '$'
    const deliveryTime = product.preparationTime || 25
    const serviceFee = Math.max(500, Math.round(product.price * 0.03 / 50) * 50)
    const discountLabel = product.price > 7000 ? '15% off: NEW15' : '10% off: SAVE10'
    const rating = 4.7 + (product.price % 3) * 0.05
    const reviews = 1200 + (product.price % 50) * 20

    return (
      <div
        key={`${variant}-${product._id}`}
        className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all cursor-pointer group"
        onClick={() => handleProductClick(product._id)}
      >
        <div className="relative h-48 bg-gray-100">
          {renderProductImage(product)}

          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
            {discountLabel}
          </div>

          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:text-[#ff416c] transition-colors shadow"
            aria-label="Ajouter aux favoris"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4.318 6.318a4.5 4.5 0 010-6.364 4.5 4.5 0 016.364 0L12 1.586l1.318-1.318a4.5 4.5 0 016.364 6.364L12 15l-7.682-8.682z" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">{product.name}</h3>
              <p className="text-xs text-gray-500">{getCategoryLabel(product)}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z" />
              </svg>
              <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
              <span className="text-gray-400">({reviews.toLocaleString('fr-FR')})</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-semibold text-gray-900 text-sm">{formatPrice(product.price)} FCFA</span>
            <span>·</span>
            <span>{priceLevel}</span>
            <span>·</span>
            <span>{getCategoryLabel(product).split('—')[0].trim()}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {deliveryTime}-{deliveryTime + 10} min
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5m1.6 8L5 21m2-8l2 8m8-8l2 8m-2-8h4" />
              </svg>
              Service {formatPrice(serviceFee)} FCFA
            </span>
          </div>

          <button
            onClick={(e) => handleQuickAdd(e, product)}
            className="w-full bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:from-[#ff5f7f] hover:to-[#ff6a3a] text-white py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Order
          </button>
        </div>
      </div>
    )
  }

  const orderSummaryContent = (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Your Address</h3>
        <p className="text-sm text-gray-600 mb-2">{getDeliveryAddress()}</p>
        <p className="text-xs text-gray-500 mb-4">
          Lorem Ipsum is simply dummy text of the printing typesetting industry lorem Ipsum.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex-1 bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:from-[#ff5f7f] hover:to-[#ff6a3a] text-white py-2 px-4 rounded-lg text-sm font-medium transition-all"
          >
            Add Details
          </button>
          <button className="flex-1 bg-pink-100 hover:bg-pink-200 text-pink-700 py-2 px-4 rounded-lg text-sm font-medium transition-all">
            Add Note
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">My Order</h3>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Votre panier est vide</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="relative flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Retirer l'article"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                    <span>Unité : {formatPrice(item.price)} FCFA</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Quantité : {item.quantity}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleDecrease(item.id, item.quantity)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-gray-900 min-w-[24px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleIncrease(item.id, item.quantity)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 text-right min-w-[90px]">
                  {formatPrice(item.price * item.quantity)} FCFA
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {items.length > 0 && (
        <>
          <div className="border-t border-gray-200 pt-4 mb-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Service</span>
              <span className="text-gray-900 font-medium">{formatPrice(serviceFee)} FCFA</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-gray-900 pt-2">
              <span>Total</span>
              <span>{formatPrice(total)} FCFA</span>
            </div>
          </div>

          <button className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700 py-3 px-4 rounded-lg text-sm font-medium transition-all mb-4 flex items-center justify-between">
            <span>Have a Promo Code?</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:from-[#ff5f7f] hover:to-[#ff6a3a] text-white py-4 px-6 rounded-lg text-base font-medium transition-all"
          >
            Checkout
          </button>
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-white overflow-x-hidden pb-20 md:pb-0">
      {/* Header simplifié */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center">
              <span className="text-2xl font-normal text-[#ff416c] tracking-tight">FAATA BEACH</span>
            </button>
            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-normal transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Nos restaurants
              </button>
              <button
                onClick={() => openModal('cart')}
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getItemCount() > 0 && (
                  <span className="absolute top-0 right-0 bg-[#ff416c] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="w-full px-4 md:px-8 lg:px-12 py-8">
        <div className="w-full max-w-[1400px] mx-auto">
          {/* Catégories horizontales */}
          <section className="mb-10 bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_12px_35px_rgba(196,196,196,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] uppercase tracking-[0.2em] text-pink-500 font-semibold">Category</p>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">Find your taste</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setStoreSelectedCategory(null)
                }}
                className="text-[#ff416c] hover:text-[#ff185f] text-sm font-medium flex items-center gap-1"
              >
                See All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex min-w-0 gap-4 pb-2 overflow-x-auto lg:overflow-visible">
              {categories.map((category, index) => {
                const isActive = selectedCategory
                  ? selectedCategory === category._id
                  : index === 0
                return (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryClick(category._id)}
                    className={`flex flex-col items-center justify-center min-w-[110px] px-4 py-4 rounded-2xl transition-all duration-200 shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-b from-[#ff416c] to-[#ff4b2b] text-white shadow-lg scale-105'
                        : 'bg-white border border-gray-200 text-gray-800 hover:border-[#ff9aad]'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 text-3xl ${
                        isActive ? 'bg-white/90 text-[#ff416c] shadow-inner' : 'bg-[#ffe9ef] text-[#ff416c]'
                      }`}
                    >
                      {categoryIcons[category.name] || '🍽️'}
                    </div>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {category.name.split('—')[0].trim()}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Colonne gauche - Produits */}
            <div className="flex-1 space-y-10">
              {/* Section Popular Food */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Popular Food</h2>
                  <button className="text-[#ff416c] hover:text-[#ff185f] text-sm font-medium flex items-center gap-1">
                    See All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {popularProducts.map((product) => renderProductCard(product, 'popular'))}
                </div>
              </section>

              {/* Produits filtrés par catégorie */}
              {selectedCategory && filteredProducts.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {categories.find(c => c._id === selectedCategory)?.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => renderProductCard(product, 'default'))}
                  </div>
                </section>
              )}

              {/* Message si aucun produit */}
              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-700 text-base font-normal mb-2">Aucun produit trouvé</p>
                  <p className="text-gray-500 text-base">Essayez de modifier vos filtres ou votre recherche</p>
                  {selectedCategory && (
                    <button
                      onClick={() => {
                        setSelectedCategory(null)
                        setStoreSelectedCategory(null)
                      }}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] text-white rounded-full font-medium hover:opacity-90 transition-colors"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar droite - My Order */}
            <aside className="hidden lg:block w-full lg:max-w-[360px] bg-white/95 border border-gray-200 rounded-2xl p-6 shadow-xl sticky top-28 h-fit max-h-[calc(100vh-140px)] overflow-y-auto">
              {orderSummaryContent}
            </aside>
          </div>

        {/* Récapitulatif mobile */}
        <div className="lg:hidden mt-10 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          {orderSummaryContent}
        </div>
      </div>
    </div>

      {/* Modales */}
      <CartModal />
      <ProductDetailModal />
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={() => setShowLocationModal(false)}
      />
      
      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />
    </div>
  )
}
