import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useModalStore } from '../store/useModalStore'
import { useCartStore } from '../store/useCartStore'
import { useFavoritesStore } from '../store/useFavoritesStore'
import { categoriesAPI, productsAPI } from '../lib/api'
import BottomNavigation from '../components/layout/BottomNavigation'
import { CartModal } from '../components/modals/CartModal'
import { ProductDetailModal } from '../components/modals/ProductDetailModal'

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
  const { addItem } = useCartStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

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
      // Si la catégorie est déjà sélectionnée, désélectionner
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

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    const itemToAdd = {
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    }
    addItem(itemToAdd)
  }

  const handleFavoriteClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    toggleFavorite({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      description: product.description,
    })
  }

  const getCategoryName = (product: Product): string => {
    if (typeof product.categoryId === 'object' && product.categoryId?.name) {
      return product.categoryId.name
    }
    const category = categories.find(c => c._id === product.categoryId)
    return category?.name || 'Menu'
  }

  const { getItemCount } = useCartStore()

  // Organiser les produits par catégorie
  const productsByCategory = categories.reduce((acc, category) => {
    const categoryProducts = allProducts.filter(product => {
      const productCategoryId = typeof product.categoryId === 'object' 
        ? product.categoryId?._id?.toString() 
        : product.categoryId?.toString()
      return productCategoryId === category._id
    })
    if (categoryProducts.length > 0) {
      acc[category._id] = {
        category,
        products: categoryProducts
      }
    }
    return acc
  }, {} as Record<string, { category: Category; products: Product[] }>)

  // Produits sans catégorie ou "best sellers"
  const bestSellers = allProducts.slice(0, 3)

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Barre supérieure sombre */}
      <div className="bg-gray-900 text-white py-2.5 px-4 hidden md:block">
        <div className="container mx-auto flex flex-wrap items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>338750938</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Service de livraison 11H00 - 23h00 7/7</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>contact@faata.com</span>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Menu hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
                  <button onClick={() => navigate('/')} className="flex items-center">
                    <span className="text-2xl font-bold text-faata-red tracking-tight">FAATA BEACH</span>
                  </button>
            </div>

            {/* Bouton Nos restaurants */}
            <button className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Nos restaurants
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Barre de recherche */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <input
                type="search"
                placeholder="Rechercher un produit..."
                className="w-full px-4 py-2.5 pl-11 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-faata-red focus:border-faata-red transition-all text-sm font-medium bg-white"
              />
              <svg className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Zone de livraison */}
            <div className="hidden xl:flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium mb-1">Zone de livraison</span>
              <button className="text-sm font-semibold text-gray-900 flex items-center gap-1 hover:text-faata-red transition-colors">
                BARGNY
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Icônes utilisateur et panier */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
          <button
                onClick={() => openModal('cart')}
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getItemCount() > 0 && (
                  <span className="absolute top-0 right-0 bg-faata-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
          </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal avec sidebar */}
      <div className="container mx-auto px-4 py-5">
        <div className="flex gap-6">
          {/* Sidebar gauche - Catégories */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                    selectedCategory === category._id
                      ? 'bg-faata-red bg-opacity-10 text-faata-red font-semibold border border-faata-red/20'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 transition-colors ${
                    selectedCategory === category._id 
                      ? 'bg-faata-red bg-opacity-20 border-faata-red/40' 
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent && !parent.querySelector('.category-fallback')) {
                            const fallback = document.createElement('div')
                            fallback.className = 'category-fallback w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center'
                            fallback.innerHTML = '<span class="text-4xl">🍽️</span>'
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                  </div>
                  <span className="text-base font-semibold flex-1 text-left leading-relaxed">{category.name}</span>
                  <svg className={`w-5 h-5 transition-transform flex-shrink-0 ${selectedCategory === category._id ? 'rotate-90 text-faata-red' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </aside>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Barre de filtres */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="text-base text-gray-800 font-medium">
                Trouvé <span className="font-bold text-gray-900">{filteredProducts.length}</span> produit{filteredProducts.length > 1 ? 's' : ''}
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Trier par:</label>
                  <select className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-faata-red focus:border-faata-red transition-all">
                    <option>Pertinence</option>
                    <option>Prix croissant</option>
                    <option>Prix décroissant</option>
                    <option>Nom A-Z</option>
                    <option>Nom Z-A</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <input
                    type="search"
                    placeholder="Rechercher un produit..."
                    className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-faata-red focus:border-faata-red transition-all flex-1 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Tags de filtres actifs */}
            {selectedCategory && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="px-4 py-2 bg-faata-red/10 text-faata-red rounded-full text-sm font-semibold flex items-center gap-2 border border-faata-red/20">
                  <span>{categories.find(c => c._id === selectedCategory)?.name || 'Catégorie'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCategory(null)
                      setStoreSelectedCategory(null)
                    }}
                    className="hover:bg-faata-red/20 rounded-full p-0.5 transition-colors"
                    aria-label="Retirer le filtre"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                    <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setStoreSelectedCategory(null)
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-faata-red transition-colors underline-offset-2 hover:underline"
                >
                  Effacer tout
                </button>
              </div>
            )}

            {/* Section NOS MEILLEURES VENTES */}
            {bestSellers.length > 0 && !selectedCategory && (
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">NOS MEILLEURES VENTES</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {bestSellers.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product._id)}
                      className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-faata-red/30 group"
                    >
                      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200" style={{ aspectRatio: '160 / 191', paddingBottom: 'calc(191 / 160 * 100%)' }}>
                        <img
                          src={product.imageUrl || '/images/placeholder-food.jpg'}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.image-fallback')) {
                              const fallback = document.createElement('div')
                              fallback.className = 'image-fallback absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-orange-200 flex items-center justify-center'
                              fallback.innerHTML = `<div class="text-center p-4"><div class="text-5xl mb-2">🍽️</div><div class="text-xs text-gray-600 font-medium">${product.name}</div></div>`
                              parent.appendChild(fallback)
                            }
                          }}
                        />
                        {!product.imageUrl && (
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-orange-200 flex items-center justify-center image-fallback">
                            <div className="text-center p-4">
                              <div className="text-5xl mb-2">🍽️</div>
                              <div className="text-xs text-gray-600 font-medium">{product.name}</div>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuickAdd(e, product)
                          }}
                          className="absolute top-3 right-3 p-2.5 bg-faata-red text-white rounded-full hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 z-10"
                          aria-label="Ajouter au panier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                      <div className="p-4">
                        <div className="text-xl font-bold text-faata-red mb-2 tracking-tight">{product.price.toLocaleString('fr-FR')} FCFA</div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1.5 leading-tight">{product.name}</h4>
                    {product.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                      </div>
                    )}

            {/* Sections par catégorie */}
            {Object.entries(productsByCategory).map(([categoryId, { category, products }]) => {
              if (selectedCategory && selectedCategory !== categoryId) return null
              return (
                <div key={categoryId} className="mb-10" id={`categorie-${categoryId}`}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">{category.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product._id)}
                        className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-faata-red/30 group"
                      >
                        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200" style={{ aspectRatio: '160 / 191', paddingBottom: 'calc(191 / 160 * 100%)' }}>
                          <img
                            src={product.imageUrl || '/images/placeholder-food.jpg'}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent && !parent.querySelector('.image-fallback')) {
                                const fallback = document.createElement('div')
                                fallback.className = 'image-fallback absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-orange-200 flex items-center justify-center'
                                fallback.innerHTML = `<div class="text-center p-4"><div class="text-5xl mb-2">🍽️</div><div class="text-xs text-gray-600 font-medium">${product.name}</div></div>`
                                parent.appendChild(fallback)
                              }
                            }}
                          />
                          {!product.imageUrl && (
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-orange-200 flex items-center justify-center image-fallback">
                              <div className="text-center p-4">
                                <div className="text-5xl mb-2">🍽️</div>
                                <div className="text-xs text-gray-600 font-medium">{product.name}</div>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuickAdd(e, product)
                            }}
                            className="absolute top-2 right-2 p-2 bg-faata-red text-white rounded-full hover:bg-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                      </button>
                    </div>
                        <div className="p-4">
                          <div className="text-xl font-bold text-faata-red mb-2 tracking-tight">{product.price.toLocaleString('fr-FR')} FCFA</div>
                          <h4 className="text-base font-semibold text-gray-900 mb-1.5 leading-tight">{product.name}</h4>
                          {product.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Message si aucun produit */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-700 text-xl font-semibold mb-2">Aucun produit trouvé</p>
                <p className="text-gray-500 text-base">Essayez de modifier vos filtres ou votre recherche</p>
                {selectedCategory && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setStoreSelectedCategory(null)
                    }}
                    className="mt-4 px-6 py-2 bg-faata-red text-white rounded-full font-medium hover:bg-red-700 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <CartModal />
      <ProductDetailModal />
      
      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />
    </div>
  )
}
