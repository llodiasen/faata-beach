import { useEffect, useState, useRef } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { useFavoritesStore } from '../../store/useFavoritesStore'
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
  const { isFavorite, toggleFavorite } = useFavoritesStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({})
  const [cartNotification, setCartNotification] = useState<string | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!selectedProduct) return

      try {
        setLoading(true)
        const data = await productsAPI.getById(selectedProduct)
        setProduct(data)
        
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

  const playCartSound = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const audioCtx = audioContextRef.current
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
      const createNote = (frequency: number, startTime: number, duration: number, type: OscillatorType = 'triangle') => {
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()

        oscillator.type = type
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime)

        gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime + startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + startTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startTime + duration)

        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        oscillator.start(audioCtx.currentTime + startTime)
        oscillator.stop(audioCtx.currentTime + startTime + duration)
      }

      // double ding type notification iOS
      createNote(1200, 0, 0.12, 'triangle')
      createNote(900, 0.12, 0.18, 'sine')
    } catch (error) {
      console.error('Unable to play cart sound', error)
    }
  }

  const showCartNotification = (message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    setCartNotification(message)
    notificationTimeoutRef.current = setTimeout(() => {
      setCartNotification(null)
    }, 2200)
  }

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const handleConfirmAndChange = () => {
    if (!product) return

    // Calculer le prix total avec les extras sélectionnés
    let totalPrice = product.price
    
    // Ajouter le prix de tous les extras sélectionnés
    if (product.extras) {
      Object.entries(selectedExtras).forEach(([name, selected]) => {
        if (selected) {
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
    
    const itemName = `${product.name}${extrasNames.length > 0 ? ` - ${extrasNames.join(', ')}` : ''}`

    const itemToAdd = {
      productId: product._id,
      name: itemName,
      price: totalPrice,
      imageUrl: imageSrc || product.imageUrl,
    }

    // Ajouter directement avec la quantité au lieu d'une boucle
    addItem(itemToAdd, quantity)

    // Son et notification
    playCartSound()
    showCartNotification(`${itemName} ajouté au panier`)

    // Réinitialiser toutes les sélections et fermer
    setQuantity(1)
    setSelectedExtras({})
    closeModal()
  }

  // Calculer le prix actuel
  let currentPrice = product?.price || 0
  // Ajouter le prix de tous les extras sélectionnés
  if (product?.extras) {
    Object.entries(selectedExtras).forEach(([name, selected]) => {
      if (selected) {
        const extra = product.extras!.find(e => e.name === name)
        if (extra) {
          currentPrice += extra.price
        }
      }
    })
  }

  const imageSrc = getProductImage(product || undefined)
  const productIsFavorite = product ? isFavorite(product._id) : false

  const handleToggleFavorite = () => {
    if (!product) return
    
    const favoriteItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: imageSrc || product.imageUrl,
      description: product.description,
      restaurant: 'FAATA BEACH'
    }
    
    toggleFavorite(favoriteItem)
  }
  
  // Calculer les calories (estimation basée sur le prix)
  const estimatedCalories = Math.round((product?.price || 0) / 50)
  const totalTime = (product?.preparationTime || 0) + (product?.deliveryTime || 0)
  const rating = 4.5 // Valeur par défaut

  return (
    <>
      {/* Notification toast */}
      {cartNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-3 z-50 flex items-center gap-3 animate-slideDown">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-gray-900">{cartNotification}</span>
        </div>
      )}

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
          <div className="bg-white rounded-lg overflow-hidden">
            {/* Header avec retour, titre et favoris */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <button
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#39512a]/10 hover:bg-[#39512a]/20 transition-colors"
              >
                <svg className="w-5 h-5 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-[#121212]">Détails</h2>
              <button
                onClick={handleToggleFavorite}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#39512a]/10 hover:bg-[#39512a]/20 transition-colors"
                aria-label={productIsFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <svg
                  className={`w-5 h-5 ${productIsFavorite ? 'text-red-500 fill-red-500' : 'text-[#39512a]'}`}
                  fill={productIsFavorite ? 'currentColor' : 'none'}
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

            {/* Image produit avec fond blanc */}
            <div className="w-full bg-white flex justify-center items-center py-8">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full max-w-[280px] h-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full max-w-[280px] h-[200px] flex items-center justify-center">
                  <span className="text-6xl">🍽️</span>
                </div>
              )}
            </div>

            {/* Contenu principal */}
            <div className="px-4 py-4 space-y-4">
              {/* Nom et prix */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#121212]">{product.name}</h3>
                <span className="text-xl font-bold text-[#39512a]">
                  {currentPrice.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Informations nutritionnelles */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-orange-500">🔥</span>
                  <span>{estimatedCalories} calories</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Temps {totalTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span>{rating} Note</span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="text-base font-bold text-[#121212] mb-2">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Section Customize */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-[#121212]">Personnaliser</h4>
                  {product.extras && product.extras.length > 0 && (
                    <button
                      onClick={() => setShowMoreDetails(!showMoreDetails)}
                      className="flex items-center gap-1 text-sm text-[#39512a] hover:text-[#39512a]/80 transition-colors"
                    >
                      <span>Plus de détails</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${showMoreDetails ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Suppléments et compléments (expandable) - Affiché avant le bouton */}
                {showMoreDetails && product.extras && product.extras.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <h5 className="text-sm font-semibold text-[#121212] mb-2">Suppléments et compléments</h5>
                    {product.extras.map((extra) => (
                      <label
                        key={extra.name}
                        className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedExtras[extra.name] || false}
                            onChange={(e) => setSelectedExtras(prev => ({
                              ...prev,
                              [extra.name]: e.target.checked
                            }))}
                            className="w-5 h-5 text-[#39512a] border-gray-300 rounded focus:ring-[#39512a]"
                          />
                          <span className="text-sm text-[#121212]">{extra.name}</span>
                        </div>
                        {extra.price > 0 && (
                          <span className="text-sm font-medium text-[#39512a]">
                            +{extra.price.toLocaleString('fr-FR')} FCFA
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Sélecteur de quantité et bouton Add to Cart */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-full">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-[#121212] hover:bg-gray-100 rounded-l-full transition-colors font-semibold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity.toString().padStart(2, '0')}
                      readOnly
                      className="w-12 text-center text-sm font-semibold border-0 focus:outline-none bg-transparent text-[#121212]"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#121212] hover:bg-gray-100 rounded-r-full transition-colors font-semibold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleConfirmAndChange}
                    className="flex-1 bg-[#39512a] hover:opacity-90 text-white py-3 px-4 rounded-lg font-medium text-sm transition-colors"
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

