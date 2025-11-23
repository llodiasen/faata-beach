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
  preparationTime?: number
  deliveryTime?: number
}

export function ProductDetailModal() {
  const { currentModal, closeModal, selectedProduct } = useModalStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null)
  const [selectedExtra, setSelectedExtra] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!selectedProduct) return

      try {
        setLoading(true)
        const data = await productsAPI.getById(selectedProduct)
        setProduct(data)
        
        // Définir les extras par défaut
        if (data.extras && data.extras.length > 0) {
          // Chercher un extra qui ressemble à un poids (contient "g" ou "kg")
          const weightExtra = data.extras.find((e: Extra) => /g|kg/i.test(e.name))
          if (weightExtra) {
            setSelectedWeight(weightExtra.name)
          }
          // Sélectionner le premier extra non-poids comme complément par défaut
          const complementExtra = data.extras.find((e: Extra) => !/g|kg/i.test(e.name))
          if (complementExtra) {
            setSelectedExtra(complementExtra.name)
          }
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

    // Calculer le prix total avec les extras sélectionnés
    let totalPrice = product.price
    
    if (selectedWeight && product.extras) {
      const weightExtra = product.extras.find(e => e.name === selectedWeight)
      if (weightExtra) {
        totalPrice = weightExtra.price
      }
    }
    
    if (selectedExtra && product.extras) {
      const extra = product.extras.find(e => e.name === selectedExtra)
      if (extra) {
        totalPrice += extra.price
      }
    }

    const itemToAdd = {
      productId: product._id,
      name: `${product.name}${selectedWeight ? ` (${selectedWeight})` : ''}${selectedExtra ? ` - ${selectedExtra}` : ''}`,
      price: totalPrice,
      imageUrl: product.imageUrl,
    }

    for (let i = 0; i < quantity; i++) {
      addItem(itemToAdd)
    }

    // Réinitialiser et fermer
    setQuantity(1)
    closeModal()
  }

  // Séparer les extras en poids et compléments
  const weightOptions = product?.extras && product.extras.length > 0
    ? product.extras.filter(e => /g|kg/i.test(e.name))
    : []
  
  const complementOptions = product?.extras && product.extras.length > 0
    ? product.extras.filter(e => !/g|kg/i.test(e.name))
    : []

  // Calculer le prix actuel
  let currentPrice = product?.price || 0
  if (selectedWeight && product?.extras) {
    const weightExtra = product.extras.find(e => e.name === selectedWeight)
    if (weightExtra) {
      currentPrice = weightExtra.price
    }
  }
  if (selectedExtra && product?.extras) {
    const extra = product.extras.find(e => e.name === selectedExtra)
    if (extra) {
      currentPrice += extra.price
    }
  }

  return (
    <Modal isOpen={currentModal === 'productDetail'} onClose={closeModal} size="md">
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
        <div className="space-y-4 px-1">
          {/* Image produit - dimensions fixes comme sur la capture */}
          <div className="w-full bg-white rounded-lg overflow-hidden flex justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full max-w-[280px] h-auto object-contain bg-white"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent && !parent.querySelector('.image-fallback')) {
                    const fallback = document.createElement('div')
                    fallback.className = 'image-fallback w-full max-w-[280px] h-[200px] bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center'
                    fallback.innerHTML = '<span class="text-5xl">🍽️</span>'
                    parent.appendChild(fallback)
                  }
                }}
              />
            ) : (
              <div className="w-full max-w-[280px] h-[200px] bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <span className="text-5xl">🍽️</span>
              </div>
            )}
          </div>

          {/* Nom du produit */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h2>
            {/* Description/Quantité en texte gris */}
            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Prix */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-900">Prix: </span>
            <span className="text-xl font-bold text-red-600">
              {currentPrice.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {/* Section Compléments et Quantité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            {/* Compléments à gauche */}
            {complementOptions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Choisissez votre complément</h3>
                <div className="space-y-2">
                  {complementOptions.map((extra) => (
                    <label
                      key={extra.name}
                      className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <input
                        type="radio"
                        name="complement"
                        value={extra.name}
                        checked={selectedExtra === extra.name}
                        onChange={() => setSelectedExtra(extra.name)}
                        className="w-4 h-4 text-faata-red border-gray-300 focus:ring-faata-red"
                      />
                      <span className="text-sm text-gray-700">{extra.name}</span>
                      {extra.price > 0 && (
                        <span className="text-xs text-gray-500 ml-auto">
                          +{extra.price.toLocaleString('fr-FR')} FCFA
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantité à droite */}
            <div className="flex flex-col justify-start">
              <label className="text-sm font-semibold text-gray-900 mb-3">Quantité:</label>
              <div className="flex items-center border border-gray-300 rounded-full w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-l-full transition-colors font-semibold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  readOnly
                  className="w-16 text-center text-sm font-semibold border-0 focus:outline-none bg-transparent"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-r-full transition-colors font-semibold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Options de poids si disponibles */}
          {weightOptions.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Taille</h3>
              <div className="flex flex-wrap gap-2">
                {weightOptions.map((extra) => (
                  <button
                    key={extra.name}
                    onClick={() => setSelectedWeight(extra.name)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedWeight === extra.name
                        ? 'border-faata-red bg-faata-red/10 text-faata-red font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {extra.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bouton Ajouter au panier */}
          <button
            onClick={handleConfirmAndChange}
            className="w-full bg-faata-red hover:bg-red-700 text-white py-4 px-6 rounded-lg font-semibold text-base transition-colors"
          >
            Ajouter au panier
          </button>
        </div>
      )}
    </Modal>
  )
}

