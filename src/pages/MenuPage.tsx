import { useEffect, useState } from 'react'
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
  const { addItem, items, removeItem, getTotal, getItemCount } = useCartStore()
  const { address: geoAddress } = useGeolocation()
  const [showLocationModal, setShowLocationModal] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])


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
      // Filtrer par categoryId
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
              fallback.className = 'image-fallback w-full h-full bg-gradient-to-br from-[#39512a]/10 via-[#2f2e2e]/5 to-[#39512a]/10 flex items-center justify-center'
              fallback.innerHTML = `<div class="text-center p-4"><div class="text-5xl mb-2">🍽️</div><div class="text-xs text-gray-600 font-medium">${product.name}</div></div>`
              parent.appendChild(fallback)
            }
          }}
        />
      )
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-[#39512a]/10 via-[#2f2e2e]/5 to-[#39512a]/10 flex items-center justify-center image-fallback">
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

  // Catégories avec produits représentatifs
  const getDisplayCategories = () => {
    // Mapper les noms de catégories pour trouver les produits représentatifs
    const categoryMapping: Record<string, { name: string; bgColor: string; productKeywords: string[] }> = {
      'Entrées': {
        name: 'Entrées',
        bgColor: 'bg-green-50',
        productKeywords: ['salade', 'niçoise', 'chef', 'italienne', 'exotique', 'chinoise', 'cocktail', 'avocat']
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
      }
    }

    return categories
      .filter(cat => categoryMapping[cat.name])
      .map(cat => {
        const mapping = categoryMapping[cat.name]
        // Trouver un produit représentatif pour cette catégorie
        const representativeProduct = allProducts.find(product => {
          const productCategoryId = typeof product.categoryId === 'object' 
            ? product.categoryId?._id?.toString() 
            : product.categoryId?.toString()
          if (productCategoryId === cat._id) {
            // Si le produit appartient à la catégorie, vérifier aussi les mots-clés pour un meilleur match
            const productName = product.name.toLowerCase()
            return mapping.productKeywords.some(keyword => productName.includes(keyword))
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
          imageUrl: representativeProduct ? getProductImage(representativeProduct) : ''
        }
      })
  }

  const renderProductCard = (product: Product, variant: 'popular' | 'default') => {
    const deliveryTime = product.preparationTime || 25
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

          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
            {discountLabel}
          </div>

          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-200/80 flex items-center justify-center text-white hover:bg-gray-300/80 transition-colors shadow-sm"
            aria-label="Ajouter aux favoris"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Nom + Catégorie à gauche, Note à droite */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#2f2e2e] leading-tight mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500">{getCategoryLabel(product)}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 flex-shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z" />
              </svg>
              <span className="font-semibold text-[#2f2e2e]">{rating.toFixed(1)}</span>
              <span className="text-gray-400">({reviews.toLocaleString('fr-FR')})</span>
            </div>
          </div>

          {/* Prix à gauche, Temps de livraison à droite */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#2f2e2e]">{formatPrice(product.price)} FCFA</span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {deliveryTime}-{deliveryTime + 10} min
            </span>
          </div>

          {/* Bouton Ajouter panier */}
          <button
            onClick={(e) => handleQuickAdd(e, product)}
            className="w-full bg-[#39512a] hover:opacity-90 text-white py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter panier
          </button>
        </div>
      </div>
    )
  }

  const orderSummaryContent = (
    <div className="flex flex-col h-full">
      {/* Section fixe en haut - Adresse */}
      <div className="mb-6 flex-shrink-0">
        <h3 className="text-sm font-normal text-gray-500 mb-2">Your Address</h3>
        <p className="text-base font-semibold text-[#2f2e2e] mb-4">{getDeliveryAddress()}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex-1 bg-[#39512a] hover:opacity-90 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
          >
            Add Details
          </button>
          <button className="flex-1 bg-[#2f2e2e]/10 hover:bg-[#2f2e2e]/20 text-[#2f2e2e] py-2.5 px-4 rounded-lg text-sm font-medium transition-all">
            Add Note
          </button>
        </div>
      </div>

      {/* Section scrollable - Liste des items */}
      <div className="mb-6 flex-1 min-h-0 flex flex-col">
        <h3 className="text-lg font-medium text-[#2f2e2e] mb-4 flex-shrink-0">My Order</h3>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2" style={{ maxHeight: '400px' }}>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Votre panier est vide</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="relative flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition-colors z-10"
                  aria-label="Retirer l'article"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2f2e2e]">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">x{item.quantity}</p>
                </div>
                <div className="text-sm font-semibold text-[#2f2e2e] text-right min-w-[80px]">
                  {formatPrice(item.price * item.quantity)} FCFA
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section fixe en bas - Total et boutons */}
      {items.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 pt-4 space-y-4">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Service</span>
              <span className="text-[#2f2e2e] font-medium">{formatPrice(serviceFee)} FCFA</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[#2f2e2e] pt-2">
              <span>Total</span>
              <span>{formatPrice(total)} FCFA</span>
            </div>
          </div>

          <button className="w-full bg-[#2f2e2e]/10 hover:bg-[#2f2e2e]/20 text-[#2f2e2e] py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-between">
            <span>Have a Promo Code?</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleCheckout}
            className="w-full bg-[#39512a] hover:opacity-90 text-white py-4 px-6 rounded-lg text-base font-medium transition-all"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-white overflow-x-hidden pb-20 md:pb-0">
      {/* Header simplifié */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center">
              <img src="/images/logo.png" alt="FAATA BEACH" className="h-8" />
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
                  <span className="absolute top-0 right-0 bg-[#39512a] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
          {/* Catégories - Slider horizontal */}
          <section className="mb-10">
            <div className="grid grid-cols-3 gap-4">
              {getDisplayCategories().map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.categoryId)
                    setStoreSelectedCategory(cat.categoryId)
                  }}
                  className={`rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all ${cat.bgColor} border border-gray-100 ${
                    selectedCategory === cat.categoryId ? 'ring-2 ring-[#39512a]' : ''
                  }`}
                >
                  <div className="relative h-32 bg-white/30 rounded-t-3xl overflow-hidden">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <span className="text-sm font-semibold text-[#2f2e2e] block">{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Colonne gauche - Produits */}
            <div className="flex-1 space-y-10">
              {/* Produits filtrés par catégorie */}
              {selectedCategory && filteredProducts.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold text-[#2f2e2e] mb-6">
                    {(() => {
                      const category = categories.find(c => c._id === selectedCategory)
                      if (!category) return ''
                      const categoryMapping: Record<string, string> = {
                        'Entrées': 'Entrées',
                        'Plats — À base de poisson': 'Poissons',
                        'Plats — À base de fruits de mer': 'Fruits de mer',
                        'Plats — À base de poulet': 'Poulet',
                        'Plats — À base de viande': 'Viandes',
                        'Accompagnements': 'Accompagnements'
                      }
                      return categoryMapping[category.name] || category.name.replace('Plats — ', '')
                    })()}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {filteredProducts.map((product) => renderProductCard(product, 'default'))}
                  </div>
                </section>
              )}

              {/* Tous les produits si aucune catégorie sélectionnée */}
              {!selectedCategory && filteredProducts.length > 0 && (
                <section>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
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
                      className="mt-4 px-6 py-2 bg-[#39512a] text-white rounded-full font-medium hover:opacity-90 transition-colors"
                    >
                      Réinitialiser les filtres
        </button>
      )}
                </div>
              )}
            </div>

            {/* Sidebar droite - My Order */}
            <aside className="hidden lg:block w-full lg:max-w-[360px] bg-white/95 border border-gray-200 rounded-2xl p-6 shadow-xl sticky top-28 h-[calc(100vh-140px)] flex flex-col">
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
