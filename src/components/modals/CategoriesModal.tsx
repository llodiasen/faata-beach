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
        <>
          {/* Section "WHAT'S ON YOUR MIND?" */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              What's on your mind?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md border border-gray-100 group"
                >
                  <div className="w-28 h-28 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-orange-200/50 group-hover:ring-orange-400/70 transition-all">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl md:text-3xl">🍽️</span>
                    )}
                  </div>
                  <span className="text-sm md:text-xs font-medium text-gray-700 text-center leading-relaxed min-h-[40px] md:min-h-[32px] flex items-center justify-center px-2">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toutes les catégories restantes en grille */}
          {categories.length > 8 && (
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                All Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.slice(8).map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryClick(category._id)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-100"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md ring-2 ring-orange-200/50">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🍽️</span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight break-words">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
