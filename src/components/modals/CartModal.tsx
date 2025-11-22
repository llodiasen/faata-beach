import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { categoriesAPI } from '../../lib/api'
import Modal from '../ui/Modal'

interface Category {
  _id: string
  name: string
}

export function CartModal() {
  const { currentModal, closeModal, openModal, setSelectedCategory } = useModalStore()
  const { items, updateQuantity, getTotal } = useCartStore()
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)

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
    return matchesSearch
  })

  const total = getTotal()

  return (
    <Modal isOpen={currentModal === 'cart'} onClose={closeModal} size="xl">
      {/* Header jaune avec recherche */}
      <div className="bg-yellow-400 px-4 py-3 rounded-t-lg mb-4 -mx-6 -mt-6">
        {/* Barre de recherche */}
        <div className="relative mb-3">
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

        {/* Tags de catégories scrollables */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategoryFilter(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategoryFilter === null
                ? 'bg-yellow-300 text-black'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tous
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => setSelectedCategoryFilter(category._id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategoryFilter === category._id
                  ? 'bg-yellow-300 text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal - Shopping list */}
      <div className="min-h-[400px] max-h-[60vh] overflow-y-auto">
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
                className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow"
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
                  <p className="text-sm text-gray-600 mb-2">{item.quantity}pcs</p>
                  <p className="text-base font-bold text-gray-900">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                  </p>
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

      {/* Footer avec total et bouton checkout */}
      {items.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-700">Total:</span>
            <span className="text-xl font-bold text-gray-900">{total.toLocaleString('fr-FR')} CFA</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <span>View Cart</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </Modal>
  )
}
