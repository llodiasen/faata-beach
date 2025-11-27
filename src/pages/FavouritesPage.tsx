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
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center flex-shrink-0 md:hidden">
              <img src="/images/logo.png" alt="FAATA BEACH" className="h-10" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <span className="text-sm text-gray-500">
                {favorites.length} {favorites.length === 1 ? 'favori' : 'favoris'}
              </span>
            )}
            <button
              onClick={() => navigate('/login')}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-all"
              aria-label="Se connecter"
            >
              <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
              </svg>
            </button>
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2"
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
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

      {/* Menu mobile modal */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#39512a]">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1">
                  <button onClick={() => { setShowMobileMenu(false); navigate('/') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span>Accueil</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/menu') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span>Menu</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/gallery') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>Galerie</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/about') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>À propos</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/location') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" /></svg><span>Nous trouver</span></button>
                </nav>
                <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                  <button onClick={() => { setShowMobileMenu(false); navigate('/login') }} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-all mb-2 flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" /></svg>Se connecter</button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/register') }} className="w-full px-4 py-3 bg-[#39512a] hover:opacity-90 text-white rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>S'inscrire</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

