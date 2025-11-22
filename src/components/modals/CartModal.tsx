import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { categoriesAPI } from '../../lib/api'

interface Category {
  _id: string
  name: string
}

export function CartModal() {
  const { currentModal, closeModal, openModal, setSelectedCategory } = useModalStore()
  const { items, updateQuantity } = useCartStore()
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesAPI.getAll()
        setCategories(data)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    if (currentModal === 'cart') {
      fetchCategories()
    }
  }, [currentModal])

  const handleCheckout = () => {
    if (items.length === 0) return
    openModal('checkout')
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    closeModal()
    openModal('products')
  }

  // Filtrer les items selon la recherche et la catégorie
  const filteredItems = items.filter((item) => {
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase())
    // Note: On ne peut pas filtrer par catégorie sans charger les produits complets
    // Pour l'instant, on filtre juste par recherche
    return matchesSearch
  })

  // Miniatures pour la barre du bas (max 3 visibles)
  const visibleThumbnails = items.slice(0, 3)
  const remainingCount = items.length - 3

  if (currentModal !== 'cart') return null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 h-screen z-50 bg-white flex flex-col">
      {/* Header jaune */}
      <div className="bg-yellow-400 px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          {/* Bouton X */}
          <button
            onClick={closeModal}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="I want to buy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-0 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Icônes notification et profil */}
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">!</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-gray-300">
              {user?.name ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Tags de catégories scrollables */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-yellow-300 text-black hover:bg-yellow-200"
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal - Shopping list */}
      <div className="flex-1 overflow-y-auto bg-white px-4 py-4">
        {/* Titre Shopping list */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">Shopping list</h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Aucun produit trouvé' : 'Votre panier est vide'}
            </p>
            <button
              onClick={() => {
                closeModal()
                openModal('categories')
              }}
              className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors"
            >
              Voir les catégories
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
              >
                {/* Image produit */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Informations produit */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.quantity}pcs</p>
                </div>

                {/* Sélecteur de quantité */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barre noire en bas - View Cart */}
      {items.length > 0 && (
        <div className="bg-black rounded-t-2xl px-4 py-4 flex-shrink-0">
          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-between text-white"
          >
            {/* Miniatures des produits */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {visibleThumbnails.map((item, index) => (
                  <div
                    key={item.id}
                    className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-white"
                    style={{ zIndex: visibleThumbnails.length - index }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center text-black font-bold text-xs">
                    +{remainingCount}
                  </div>
                )}
              </div>
            </div>

            {/* Texte View Cart */}
            <span className="flex-1 text-center font-semibold">View Cart</span>

            {/* Flèche droite */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
