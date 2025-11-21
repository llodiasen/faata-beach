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
              className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 text-left transition-colors border-2 border-transparent hover:border-faata-red"
            >
              {category.imageUrl && (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
              {category.description && <p className="text-gray-600 text-sm">{category.description}</p>}
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

