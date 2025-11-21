import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
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
  const { addItem } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

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

  const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation() // Empêcher l'ouverture de la modal de détail

    const itemToAdd = {
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    }

    addItem(itemToAdd)

    // Afficher une confirmation visuelle
    setAddedProducts(prev => new Set(prev).add(product._id))
    setTimeout(() => {
      setAddedProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(product._id)
        return newSet
      })
    }, 1500)
  }

  return (
    <Modal isOpen={currentModal === 'products'} onClose={closeModal} title="Nos produits" size="lg">
      {loading && <div className="text-center py-8">Chargement...</div>}
      {error && <div className="text-red-600 text-center py-4">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-left transition-colors border-2 border-transparent hover:border-faata-red relative"
            >
              <button
                onClick={() => handleProductClick(product._id)}
                className="w-full text-left"
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
                <p className="text-faata-red font-bold text-lg mb-3">{product.price.toLocaleString('fr-FR')} CFA</p>
              </button>
              
              {/* Bouton d'ajout rapide */}
              <button
                onClick={(e) => handleQuickAddToCart(e, product)}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  addedProducts.has(product._id)
                    ? 'bg-green-500 text-white'
                    : 'bg-faata-red hover:bg-red-700 text-white'
                }`}
              >
                {addedProducts.has(product._id) ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ajouté !
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter au panier
                  </span>
                )}
              </button>
            </div>
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

