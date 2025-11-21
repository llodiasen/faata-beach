import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { categoriesAPI } from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

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
        // Afficher plus de détails dans la console pour le débogage
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            stack: err.stack
          })
        }
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
    <Modal isOpen={currentModal === 'categories'} onClose={closeModal} title="Choisissez une catégorie" size="lg">
      {loading && <div className="text-center py-8">Chargement...</div>}
      {error && <div className="text-red-600 text-center py-4">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
              className="relative bg-gray-50 hover:bg-gray-100 rounded-xl p-0 text-left transition-all duration-200 border-2 border-transparent hover:border-faata-red overflow-hidden group"
            >
              {category.imageUrl ? (
                <div className="relative w-full h-40 md:h-48 overflow-hidden">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-xl md:text-2xl font-bold mb-1 drop-shadow-lg">{category.name}</h3>
                    {category.description && (
                      <p className="text-white/90 text-sm drop-shadow-md">{category.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 md:h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={closeModal}>
          Retour
        </Button>
      </div>
    </Modal>
  )
}

