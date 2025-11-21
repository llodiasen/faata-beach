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

export function ProductDetailModal() {
  const { currentModal, closeModal, openModal, selectedProduct } = useModalStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!selectedProduct) return

      try {
        setLoading(true)
        const data = await productsAPI.getById(selectedProduct)
        setProduct(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (currentModal === 'productDetail' && selectedProduct) {
      fetchProduct()
    }
  }, [currentModal, selectedProduct])

  const handleAddToCart = () => {
    if (!product) return

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    })

    // Ajouter plusieurs fois si quantity > 1
    for (let i = 1; i < quantity; i++) {
      addItem({
        productId: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      })
    }

    openModal('cart')
  }

  return (
    <Modal isOpen={currentModal === 'productDetail'} onClose={closeModal} title="Détails du produit" size="md">
      {loading && <div className="text-center py-8">Chargement...</div>}
      {error && <div className="text-red-600 text-center py-4">{error}</div>}
      {!loading && !error && product && (
        <div>
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} className="w-full h-64 object-cover rounded-lg mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
          {product.description && <p className="text-gray-600 mb-4">{product.description}</p>}
          <p className="text-3xl font-bold text-faata-red mb-6">{product.price.toFixed(2)} €</p>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Quantité</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
              >
                -
              </button>
              <span className="text-xl font-bold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="primary" onClick={handleAddToCart} className="flex-1">
              Ajouter au panier
            </Button>
            <Button variant="outline" onClick={() => openModal('products')}>
              Retour
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

