import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { productsAPI } from '../../lib/api'
import Modal from '../ui/Modal'
import { getProductImage } from '../../lib/productImages'

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
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({})

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
        }
        setSelectedExtras({})
        
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
    
    // Ajouter le prix de tous les extras sélectionnés
    if (product.extras) {
      Object.entries(selectedExtras).forEach(([name, selected]) => {
        if (selected && name !== selectedWeight) {
          const extra = product.extras!.find(e => e.name === name)
          if (extra) {
            totalPrice += extra.price
          }
        }
      })
    }

    // Construire le nom avec les extras sélectionnés
    const extrasNames = Object.entries(selectedExtras)
      .filter(([_, selected]) => selected)
      .map(([name]) => name)
      .filter(name => name !== selectedWeight)
    
    const itemName = `${product.name}${selectedWeight ? ` (${selectedWeight})` : ''}${extrasNames.length > 0 ? ` - ${extrasNames.join(', ')}` : ''}`

    const itemToAdd = {
      productId: product._id,
      name: itemName,
      price: totalPrice,
      imageUrl: imageSrc || product.imageUrl,
    }

    // Ajouter directement avec la quantité au lieu d'une boucle
    addItem(itemToAdd, quantity)

    // Réinitialiser toutes les sélections et fermer
    setQuantity(1)
    setSelectedWeight(null)
    setSelectedExtras({})
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
  // Ajouter le prix de tous les extras sélectionnés
  if (product?.extras) {
    Object.entries(selectedExtras).forEach(([name, selected]) => {
      if (selected && name !== selectedWeight) {
        const extra = product.extras!.find(e => e.name === name)
        if (extra) {
          currentPrice += extra.price
        }
      }
    })
  }

  const imageSrc = getProductImage(product || undefined)

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
            {imageSrc ? (
              <img
                src={imageSrc}
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
            <h2 className="text-base font-normal text-gray-900 mb-1">{product.name}</h2>
            {/* Description/Quantité en texte gris */}
            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Prix */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-900">Prix: </span>
            <span className="text-base font-normal text-red-600">
              {currentPrice.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {/* Section Compléments et Quantité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            {/* Compléments à gauche */}
            {complementOptions.length > 0 && (
              <div>
                <h3 className="text-xs font-normal text-gray-700 mb-3">Choisissez vos compléments</h3>
                <div className="space-y-2">
                  {complementOptions.map((extra) => (
                    <label
                      key={extra.name}
                      className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExtras[extra.name] || false}
                        onChange={(e) => setSelectedExtras(prev => ({
                          ...prev,
                          [extra.name]: e.target.checked
                        }))}
                        className="w-4 h-4 text-faata-red border-gray-300 rounded focus:ring-faata-red"
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
              <label className="text-xs font-normal text-gray-700 mb-3">Quantité:</label>
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
              <h3 className="text-xs font-normal text-gray-700 mb-3 uppercase tracking-wide">Taille</h3>
              <div className="flex flex-wrap gap-2">
                {weightOptions.map((extra) => (
                  <button
                    key={extra.name}
                    onClick={() => setSelectedWeight(extra.name)}
                    className={`px-3 py-1.5 rounded-lg border-2 transition-colors text-xs ${
                      selectedWeight === extra.name
                        ? 'border-faata-red bg-faata-red/10 text-faata-red font-normal'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 font-normal'
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
                className="w-full bg-faata-red hover:bg-red-700 text-white py-4 px-6 rounded-lg font-normal text-sm transition-colors"
          >
            Ajouter au panier
          </button>
        </div>
      )}
    </Modal>
  )
}

