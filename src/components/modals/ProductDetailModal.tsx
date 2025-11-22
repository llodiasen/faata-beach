import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { productsAPI } from '../../lib/api'
import Modal from '../ui/Modal'

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
  categoryId?: any
}

export function ProductDetailModal() {
  const { currentModal, closeModal, selectedProduct } = useModalStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null)
  const [showAllergens, setShowAllergens] = useState(false)
  const [showDescription, setShowDescription] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!selectedProduct) return

      try {
        setLoading(true)
        const data = await productsAPI.getById(selectedProduct)
        setProduct(data)
        
        // Définir le poids par défaut si des extras de type poids sont disponibles
        if (data.extras && data.extras.length > 0) {
          // Chercher un extra qui ressemble à un poids (contient "g" ou "kg")
          const weightExtra = data.extras.find((e: Extra) => /g|kg/i.test(e.name))
          if (weightExtra) {
            setSelectedWeight(weightExtra.name)
          } else {
            // Si pas de poids, prendre le premier extra ou définir 1200g par défaut
            setSelectedWeight(data.extras[0]?.name || '1200g')
          }
        } else {
          // Par défaut, sélectionner 1200g
          setSelectedWeight('1200g')
        }
        
        setError(null)
        setQuantity(1)
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

  const handleConfirmAndChange = () => {
    if (!product) return

    const basePrice = selectedWeight && product.extras
      ? product.extras.find(e => e.name === selectedWeight)?.price || product.price
      : product.price

    const itemToAdd = {
      productId: product._id,
      name: `${product.name}${selectedWeight ? ` (${selectedWeight})` : ''}`,
      price: basePrice,
      imageUrl: product.imageUrl,
    }

    for (let i = 0; i < quantity; i++) {
      addItem(itemToAdd)
    }

    // Réinitialiser et fermer
    setQuantity(1)
    closeModal()
  }

  // Préparer les options de poids : utiliser les extras ou par défaut 450g et 1200g
  const weightOptions = product?.extras && product.extras.length > 0
    ? product.extras.map(e => e.name).filter(name => /g|kg/i.test(name))
    : ['450g', '1200g'] // Options par défaut

  // Si pas d'extras de poids, ajouter les options par défaut
  const defaultWeights = weightOptions.length === 0 ? ['450g', '1200g'] : weightOptions
  const currentWeight = selectedWeight || (defaultWeights.length > 1 ? defaultWeights[1] : defaultWeights[0])

  const currentPrice = selectedWeight && product?.extras
    ? product.extras.find(e => e.name === selectedWeight)?.price || product?.price || 0
    : product?.price || 0

  return (
    <Modal isOpen={currentModal === 'productDetail'} onClose={closeModal} size="lg">
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

      {!loading && !error && product && (
        <div className="space-y-6">
          {/* Image produit */}
          {product.imageUrl && (
            <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-orange-200/40 relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover brightness-105 contrast-110"
              />
              {/* Overlay gradient subtil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
            </div>
          )}

          {/* Nom et prix */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-xl font-bold text-gray-900">
              {currentPrice.toLocaleString('fr-FR')} CFA
            </p>
          </div>

          {/* Section Weight */}
          {defaultWeights.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Weight</label>
              <div className="flex gap-3 flex-wrap">
                {defaultWeights.map((weight, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedWeight(weight)}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                      currentWeight === weight
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Quantity</label>
            <div className="flex items-center gap-4 max-w-xs">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                  quantity <= 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-xl font-semibold text-gray-900">{quantity}</span>
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Section Allergens (expandable) */}
          <div className="pb-4 border-b border-gray-200">
            <button
              onClick={() => setShowAllergens(!showAllergens)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-medium text-gray-700">Allergens</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showAllergens ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAllergens && (
              <div className="mt-3 text-sm text-gray-600">
                <p>Gluten, Lait, Œufs</p>
              </div>
            )}
          </div>

          {/* Section Description (expandable) */}
          {product.description && (
            <div className="pb-4 border-b border-gray-200">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-gray-700">Description</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${showDescription ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDescription && (
                <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </div>
              )}
            </div>
          )}

          {/* Bouton Confirm and change */}
          <button
            onClick={handleConfirmAndChange}
            className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Confirm and change
          </button>
        </div>
      )}
    </Modal>
  )
}
