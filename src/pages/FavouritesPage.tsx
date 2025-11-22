import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavoritesStore } from '../store/useFavoritesStore'
import { useCartStore } from '../store/useCartStore'
import { useModalStore } from '../store/useModalStore'
import BottomNavigation from '../components/layout/BottomNavigation'

interface FavoriteItem {
  productId: string
  name: string
  price: number
  imageUrl?: string
  description?: string
  restaurant?: string
}

export default function FavouritesPage() {
  const navigate = useNavigate()
  const { items: favorites, removeFavorite } = useFavoritesStore()
  const { addItem } = useCartStore()
  const { openModal } = useModalStore()
  const [restaurant, setRestaurant] = useState('FAATA Beach')

  useEffect(() => {
    // Charger le nom du restaurant depuis les produits favoris ou utiliser la valeur par défaut
    if (favorites.length > 0 && favorites[0].restaurant) {
      setRestaurant(favorites[0].restaurant)
    }
  }, [favorites])

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`)
  }

  const handleAddToCart = (e: React.MouseEvent, favorite: FavoriteItem) => {
    e.stopPropagation()
    addItem({
      productId: favorite.productId,
      name: favorite.name,
      price: favorite.price,
      imageUrl: favorite.imageUrl,
    })
    openModal('cart')
  }

  const handleRemoveFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    removeFavorite(productId)
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-500">Mes favoris</h1>
          {favorites.length > 0 && (
            <span className="text-sm text-gray-500">
              {favorites.length} {favorites.length === 1 ? 'favori' : 'favoris'}
            </span>
          )}
        </div>
      </div>

      {/* Liste des favoris */}
      <div className="px-4 py-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium mb-2">Aucun favori</p>
            <p className="text-gray-400 text-sm">Commencez à ajouter vos produits préférés</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <button
                key={favorite.productId}
                onClick={() => handleProductClick(favorite.productId)}
                className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-start gap-4 text-left group"
              >
                {/* Image du produit */}
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  {favorite.imageUrl ? (
                    <img
                      src={favorite.imageUrl}
                      alt={favorite.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
                    {favorite.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {favorite.restaurant || restaurant}
                  </p>
                  {favorite.description && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                      {favorite.description}
                    </p>
                  )}
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Prix et actions */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-900">
                      {favorite.price.toLocaleString('fr-FR')} CFA
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Bouton supprimer favori */}
                      <button
                        onClick={(e) => handleRemoveFavorite(e, favorite.productId)}
                        className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                        aria-label="Retirer des favoris"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Bouton ajouter au panier */}
                      <button
                        onClick={(e) => handleAddToCart(e, favorite)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />
    </div>
  )
}

