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
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll()
        ])
        
        setCategories(categoriesData)
        
        // Sélectionner les 6 premiers produits comme populaires
        setPopularProducts(productsData.slice(0, 6))
        
        // Sélectionner 4 produits aléatoires comme recommandés
        const shuffled = [...productsData].sort(() => 0.5 - Math.random())
        setRecommendedProducts(shuffled.slice(0, 4))
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [])

  const handleCategoryClick = () => {
    openModal('categories')
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

  // Récupérer le nom du premier mot de l'utilisateur
  const userName = user?.name?.split(' ')[0] || 'Guest'

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Header avec profil */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Photo de profil */}
            <div className="w-12 h-12 rounded-full border-2 border-red-500 overflow-hidden flex items-center justify-center bg-gray-200">
              {user?.name ? (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Hello, <span className="text-red-500 font-semibold">{userName}</span>
              </p>
              <p className="text-xs text-gray-500">What do you want to eat today!</p>
            </div>
          </div>
          
          {/* Icône notification */}
          <button className="relative">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">90+</span>
          </button>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="px-4 py-6 space-y-6">
        {/* Section Food Category */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Food Category</h2>
            <button 
              onClick={() => openModal('categories')}
              className="text-sm text-red-500 font-semibold flex items-center gap-1 hover:text-red-600"
            >
              See Menu
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Catégories scrollables horizontalement */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category._id}
                onClick={handleCategoryClick}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex-shrink-0 min-w-[80px]"
              >
                {category.imageUrl ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-md ring-2 ring-gray-200">
                    <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-md">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700 text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Popular Food */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Popular Food</h2>
            <button 
              onClick={() => openModal('categories')}
              className="text-sm text-red-500 font-semibold flex items-center gap-1 hover:text-red-600"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Produits populaires scrollables horizontalement */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {popularProducts.map((product) => {
              const categoryName = typeof product.categoryId === 'object' 
                ? product.categoryId?.name 
                : categories.find(c => c._id === product.categoryId)?.name || 'Menu'
              
              return (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden flex-shrink-0 w-[280px] cursor-pointer hover:shadow-xl transition-shadow group"
                >
                  {/* Image produit */}
                  <div className="w-full h-40 bg-gray-100 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-105 contrast-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badge catégorie */}
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {categoryName} {'>'}
                    </div>
                  </div>

                  {/* Contenu texte */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 text-base">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Rating et Temps de livraison */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-xs text-gray-600 ml-1">4.5</span>
                      </div>
                      {/* Temps de livraison */}
                      {(product.preparationTime || product.deliveryTime) && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {(product.preparationTime || 0) + (product.deliveryTime || 0)} min
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Prix et actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {product.price.toLocaleString('fr-FR')} CFA
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleQuickAdd(e, product)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Quick Add
                        </button>
                        <button
                          onClick={(e) => handleFavoriteClick(e, product)}
                          className={`p-2 rounded-lg transition-colors ${
                            isFavorite(product._id)
                              ? 'bg-red-100 text-red-500'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <svg className="w-5 h-5" fill={isFavorite(product._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section Recommended for You */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
            <button 
              onClick={() => openModal('categories')}
              className="text-sm text-red-500 font-semibold flex items-center gap-1 hover:text-red-600"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Produits recommandés scrollables horizontalement */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recommendedProducts.map((product) => {
              const categoryName = typeof product.categoryId === 'object' 
                ? product.categoryId?.name 
                : categories.find(c => c._id === product.categoryId)?.name || 'Menu'
              
              return (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden flex-shrink-0 w-[200px] cursor-pointer hover:shadow-xl transition-shadow group"
                >
                  {/* Image produit */}
                  <div className="w-full h-32 bg-gray-100 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-105 contrast-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badge catégorie */}
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {categoryName} {'>'}
                    </div>
                  </div>

                  {/* Contenu texte */}
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 mb-2 text-sm">{product.name}</h3>
                    <span className="text-base font-bold text-gray-900">
                      {product.price.toLocaleString('fr-FR')} CFA
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bouton panier flottant */}
      {useCartStore.getState().getItemCount() > 0 && (
        <button
          onClick={() => openModal('cart')}
          className="fixed bottom-24 md:bottom-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 z-40 hover:bg-red-600 transition-colors text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Panier</span>
          <span className="bg-white text-red-500 rounded-full px-1.5 py-0.5 text-xs font-bold">
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

