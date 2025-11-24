import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { currentModal, closeModal, setSelectedCategory } = useModalStore()
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
    closeModal()
    // Naviguer vers la page menu avec la catégorie sélectionnée
    navigate('/menu', { state: { categoryId } })
  }

  return (
    <Modal isOpen={currentModal === 'categories'} onClose={closeModal} size="xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Nos Catégories</h2>
        <p className="text-gray-600 text-sm mt-1">Choisissez une catégorie pour voir nos produits</p>
      </div>

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
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 group border border-gray-100 hover:border-gray-200 hover:shadow-sm"
            >
              {/* Icône circulaire */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 border-2 border-gray-200 group-hover:border-[#39512a]/30 transition-colors">
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
                        fallback.className = 'category-fallback w-full h-full bg-gradient-to-br from-[#39512a]/10 to-[#2f2e2e]/10 flex items-center justify-center'
                        fallback.innerHTML = '<span class="text-4xl">🍽️</span>'
                        parent.appendChild(fallback)
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#39512a]/10 to-[#2f2e2e]/10 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}
              </div>

              {/* Nom de la catégorie */}
              <div className="flex-1 text-left">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#39512a] transition-colors">
                  {category.name}
                </h3>
              </div>

              {/* Flèche */}
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#39512a] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
