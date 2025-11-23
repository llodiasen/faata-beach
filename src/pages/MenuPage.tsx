import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useModalStore } from '../store/useModalStore'
import { useCartStore } from '../store/useCartStore'
import { useFavoritesStore } from '../store/useFavoritesStore'
import { categoriesAPI, productsAPI } from '../lib/api'
import BottomNavigation from '../components/layout/BottomNavigation'
import { CartModal } from '../components/modals/CartModal'

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
  const { user } = useAuthStore()
  const { openModal } = useModalStore()
  const { addItem } = useCartStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

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
    } else {
      setSelectedCategory(categoryId)
    }
  }

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`)
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header minimaliste */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Menu</h1>
        </div>
      </div>

      {/* Catégories - Style épuré */}
      <div className="px-4 py-6 bg-white border-b border-gray-200">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category._id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Produits - Grille style Airbnb */}
      <div className="px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const categoryName = getCategoryName(product)
              
              return (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Image grande - Style Airbnb */}
                  <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Bouton favoris en overlay */}
                    <button
                      onClick={(e) => handleFavoriteClick(e, product)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                    >
                      <svg 
                        className={`w-5 h-5 ${isFavorite(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                        fill={isFavorite(product._id) ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Contenu - Style épuré */}
                  <div className="p-5">
                    {/* Catégorie */}
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {categoryName}
                    </p>
                    
                    {/* Titre en évidence */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    
                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Temps de livraison */}
                    {(product.preparationTime || product.deliveryTime) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {(product.preparationTime || 0) + (product.deliveryTime || 0)} min
                        </span>
                      </div>
                    )}

                    {/* Prix et action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-semibold text-gray-900">
                          {product.price.toLocaleString('fr-FR')} CFA
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bouton panier flottant */}
      {useCartStore.getState().getItemCount() > 0 && (
        <button
          onClick={() => openModal('cart')}
          className="fixed bottom-24 md:bottom-6 right-6 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 z-40 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="font-medium">Panier</span>
          <span className="bg-white text-gray-900 rounded-full px-2 py-0.5 text-xs font-bold">
            {useCartStore.getState().getItemCount()}
          </span>
        </button>
      )}

      {/* Modales */}
      <CartModal />
      
      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />
    </div>
  )
}
