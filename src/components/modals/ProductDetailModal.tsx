import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { productsAPI } from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface Extra {
  name: string
  price: number
}

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  extras?: Extra[]
}

export function ProductDetailModal() {
  const { currentModal, closeModal, openModal, selectedProduct } = useModalStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchProduct = async () => {
      if (!selectedProduct) return

      try {
        setLoading(true)
        const data = await productsAPI.getById(selectedProduct)
        setProduct(data)
        setError(null)
        setSelectedExtras({}) // Réinitialiser les extras quand on charge un nouveau produit
        setQuantity(1) // Réinitialiser la quantité
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

  const handleToggleExtra = (extraName: string) => {
    setSelectedExtras(prev => ({
      ...prev,
      [extraName]: !prev[extraName]
    }))
  }

  const calculateTotalPrice = () => {
    if (!product) return 0
    let total = product.price
    if (product.extras) {
      product.extras.forEach(extra => {
        if (selectedExtras[extra.name]) {
          total += extra.price
        }
      })
    }
    return total
  }

  const handleAddToCart = () => {
    if (!product) return

    // Calculer le prix total avec les extras
    const totalPrice = calculateTotalPrice()

    // Ajouter l'item (sans id, il sera généré automatiquement)
    const itemToAdd = {
      productId: product._id,
      name: product.name,
      price: totalPrice, // Prix incluant les extras
      imageUrl: product.imageUrl,
    }

    // Ajouter l'item plusieurs fois selon la quantité
    for (let i = 0; i < quantity; i++) {
      addItem(itemToAdd)
    }

    // Réinitialiser les extras sélectionnés
    setSelectedExtras({})
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
          <p className="text-3xl font-bold text-faata-red mb-6">{product.price.toLocaleString('fr-FR')} CFA</p>

          {/* Extras - Toujours affiché, même s'il n'y en a pas */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3 text-lg">Extras disponibles</label>
            {product.extras && product.extras.length > 0 ? (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {product.extras.map((extra, index) => (
                    <label
                      key={index}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedExtras[extra.name]
                          ? 'border-faata-red bg-red-50'
                          : 'border-gray-200 hover:border-faata-red hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedExtras[extra.name] || false}
                          onChange={() => handleToggleExtra(extra.name)}
                          className="w-5 h-5 text-faata-red rounded focus:ring-faata-red focus:ring-2"
                        />
                        <span className="text-gray-900 font-medium">{extra.name}</span>
                      </div>
                      <span className="text-faata-red font-bold ml-3">+{extra.price.toLocaleString('fr-FR')} CFA</span>
                    </label>
                  ))}
                </div>
                
                {/* Résumé du prix avec extras */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-semibold">Prix de base:</span>
                    <span className="text-gray-900 font-bold">{product.price.toLocaleString('fr-FR')} CFA</span>
                  </div>
                  {Object.keys(selectedExtras).some(key => selectedExtras[key]) && (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 font-semibold">Extras sélectionnés:</span>
                        <span className="text-gray-900 font-bold">
                          +{product.extras
                            .filter(extra => selectedExtras[extra.name])
                            .reduce((sum, extra) => sum + extra.price, 0)
                            .toLocaleString('fr-FR')} CFA
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="text-lg font-bold text-gray-900">Total unitaire:</span>
                        <span className="text-xl font-bold text-faata-red">{calculateTotalPrice().toLocaleString('fr-FR')} CFA</span>
                      </div>
                      {quantity > 1 && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-faata-red">
                          <span className="text-xl font-bold text-gray-900">Total ({quantity}x):</span>
                          <span className="text-2xl font-bold text-faata-red">{(calculateTotalPrice() * quantity).toLocaleString('fr-FR')} CFA</span>
                        </div>
                      )}
                    </>
                  )}
                  {!Object.keys(selectedExtras).some(key => selectedExtras[key]) && (
                    <p className="text-sm text-gray-500 italic">Aucun extra sélectionné</p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <p className="text-gray-500">Aucun extra disponible pour ce produit</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2 text-lg">Quantité</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold text-xl transition-colors"
              >
                -
              </button>
              <span className="text-2xl font-bold w-16 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold text-xl transition-colors"
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

