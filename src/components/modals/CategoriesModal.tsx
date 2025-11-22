import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { categoriesAPI } from '../../lib/api'
import Modal from '../ui/Modal'

interface Category {
  _id: string
  name: string
  description?: string
  imageUrl?: string
}

export function CategoriesModal() {
  const { currentModal, closeModal, openModal, setSelectedCategory } = useModalStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const data = await categoriesAPI.getAll()
        setCategories(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching categories:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (currentModal === 'categories') {
      fetchCategories()
    }
  }, [currentModal])

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    openModal('products')
  }

  return (
    <Modal isOpen={currentModal === 'categories'} onClose={closeModal} size="lg">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Chargement...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600 text-center p-4">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {categories.map((category, index) => {
            // Alterner entre gris foncé et vert clair
            const isDark = index % 2 === 0
            const bgColor = isDark ? 'bg-gray-800' : 'bg-green-100'
            const textColor = isDark ? 'text-white' : 'text-gray-900'
            
            return (
              <button
                key={category._id}
                onClick={() => handleCategoryClick(category._id)}
                className={`w-full ${bgColor} rounded-2xl p-6 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group`}
              >
                {/* Contenu texte à gauche */}
                <div className="flex-1 text-left z-10">
                  <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                      {category.description}
                    </p>
                  )}
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    FAATA Beach - Dakar
                  </p>
                </div>

                {/* Image à droite */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all ml-4 flex-shrink-0 relative z-10">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-105 contrast-110"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-green-200'}`}>
                      <span className="text-5xl md:text-6xl">🍽️</span>
                    </div>
                  )}
                  {/* Overlay gradient subtil */}
                  <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
