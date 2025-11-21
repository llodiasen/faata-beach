import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { productsAPI } from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
}

export function ProductsModal() {
  const { currentModal, closeModal, openModal, setSelectedProduct, selectedCategory } = useModalStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory) return

      try {
        setLoading(true)
        const data = await productsAPI.getAll(selectedCategory)
        setProducts(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (currentModal === 'products' && selectedCategory) {
      fetchProducts()
    }
  }, [currentModal, selectedCategory])

  const handleProductClick = (productId: string) => {
    setSelectedProduct(productId)
    openModal('productDetail')
  }

  return (
    <Modal isOpen={currentModal === 'products'} onClose={closeModal} title="Nos produits" size="lg">
      {loading && <div className="text-center py-8">Chargement...</div>}
      {error && <div className="text-red-600 text-center py-4">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <button
              key={product._id}
              onClick={() => handleProductClick(product._id)}
              className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-left transition-colors border-2 border-transparent hover:border-faata-red"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
              {product.description && <p className="text-gray-600 text-sm mb-2">{product.description}</p>}
              <p className="text-faata-red font-bold text-lg">{product.price.toLocaleString('fr-FR')} CFA</p>
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => openModal('categories')}>
          Retour aux catégories
        </Button>
        <Button variant="outline" onClick={closeModal}>
          Fermer
        </Button>
      </div>
    </Modal>
  )
}

