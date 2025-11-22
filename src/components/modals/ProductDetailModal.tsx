import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { productsAPI, categoriesAPI } from '../../lib/api'

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
  const { currentModal, closeModal, openModal, selectedProduct } = useModalStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
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
          const weightExtra = data.extras.find(e => /g|kg/i.test(e.name))
          if (weightExtra) {
            setSelectedWeight(weightExtra.name)
          } else {
            setSelectedWeight(data.extras[0].name)
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

  const calculateTotalPrice = () => {
    if (!product) return 0
    let total = product.price
    
    // Ajouter le prix de l'extra sélectionné (poids)
    if (product.extras && selectedWeight) {
      const selectedExtra = product.extras.find(e => e.name === selectedWeight)
      if (selectedExtra) {
        total = selectedExtra.price // Utiliser le prix de l'extra comme prix de base
      }
    }
    
    return total * quantity
  }

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

  // Préparer les options de poids depuis les extras
  // Si aucun extra n'est disponible, créer des options par défaut
  const weightOptions = product?.extras && product.extras.length > 0
    ? product.extras.map(e => e.name)
    : ['450g', '1200g'] // Options par défaut si pas d'extras

  // Utiliser le poids sélectionné ou le premier par défaut
  const currentWeight = selectedWeight || weightOptions[0]

  if (currentModal !== 'productDetail') return null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 h-screen z-50 bg-yellow-50 flex flex-col">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Chargement...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-600 text-center p-4">{error}</div>
        </div>
      )}

      {!loading && !error && product && (
        <>
          {/* Image produit grande */}
          <div className="relative w-full h-64 bg-gray-100 flex-shrink-0">
            {/* Boutons retour et favoris sur l'image */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              >
                <svg
                  className={`w-6 h-6 ${isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-700'}`}
                  fill={isFavorited ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Section blanche avec détails */}
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 relative z-10">
            <div className="p-6">
              {/* Nom du produit */}
              <h1 className="text-2xl font-bold text-gray-900 mb-6">{product.name}</h1>

              {/* Sélecteur de poids */}
              {weightOptions.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm text-gray-600 mb-2">Weight</label>
                  <div className="flex gap-2">
                    {weightOptions.map((weight, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedWeight(weight)}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                          currentWeight === weight
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {weight}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sélecteur de quantité */}
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg py-2 px-4 text-center font-semibold">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center font-bold text-black transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Section Allergens (expandable) */}
              <div className="mb-4 border-b border-gray-200 pb-4">
                <button
                  onClick={() => setShowAllergens(!showAllergens)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-sm text-gray-600">Allergens</span>
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
                  <div className="mt-2 text-sm text-gray-700">
                    <p>Gluten, Lait, Œufs</p>
                  </div>
                )}
              </div>

              {/* Section Description (expandable) */}
              {product.description && (
                <div className="mb-6 border-b border-gray-200 pb-4">
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="text-sm text-gray-600">Description</span>
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
                    <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                      {product.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barre d'action en bas */}
          <div className="bg-white border-t border-gray-200 px-4 py-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Bouton edit */}
              <button className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

              {/* Bouton Confirm and change */}
              <button
                onClick={handleConfirmAndChange}
                className="flex-1 bg-black text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Confirm and change
              </button>
            </div>

            {/* Texte d'instruction */}
            <p className="text-xs text-gray-500 text-center">
              Tap and hold to update this item to your cart and add another with different options
            </p>
          </div>
        </>
      )}
    </div>
  )
}
