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
  const [searchQuery, setSearchQuery] = useState('')

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

  // Filtrer les catégories selon la recherche
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Modal isOpen={currentModal === 'categories'} onClose={closeModal} size="lg">
      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-faata-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search for categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-faata-red focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
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
        <>
          {/* Section "WHAT'S ON YOUR MIND?" */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              What's on your mind?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredCategories.slice(0, 8).map((category) => (
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

          {/* Section "EXPLORE" */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Explore
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Offers */}
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Offers</span>
              </button>

              {/* Premium */}
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Premium</span>
              </button>

              {/* Top 10 */}
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Top 10</span>
              </button>

              {/* Collections */}
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Collections</span>
              </button>
            </div>
          </div>

          {/* Toutes les catégories restantes en grille */}
          {filteredCategories.length > 8 && (
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                All Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCategories.slice(8).map((category) => (
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
