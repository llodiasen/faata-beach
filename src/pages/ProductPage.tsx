import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCartStore } from '../store/useCartStore'
import { useModalStore } from '../store/useModalStore'
import { productsAPI } from '../lib/api'
import Header from '../components/layout/Header'
import { CartModal } from '../components/modals/CartModal'

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

// interface Category {
//   _id: string
//   name: string
// }

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const { addItem, getItemCount } = useCartStore()
  const { openModal } = useModalStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({})
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const productData = await productsAPI.getById(id)
        
        setProduct(productData)
        
        // Définir la taille par défaut
        if (productData.extras && productData.extras.length > 0) {
          const sizeExtra = productData.extras.find((e: Extra) => /g|kg/i.test(e.name))
          if (sizeExtra) {
            setSelectedSize(sizeExtra.name)
          } else {
            setSelectedSize(productData.extras[0]?.name || null)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAddToOrder = () => {
    if (!product) return

    const basePrice = selectedSize && product.extras
      ? product.extras.find(e => e.name === selectedSize)?.price || product.price
      : product.price

    // Ajouter le prix des extras sélectionnés
    let totalPrice = basePrice
    if (product.extras) {
      product.extras.forEach(extra => {
        if (selectedExtras[extra.name] && extra.name !== selectedSize) {
          totalPrice += extra.price
        }
      })
    }

    const itemToAdd = {
      productId: product._id,
      name: `${product.name}${selectedSize ? ` (${selectedSize})` : ''}`,
      price: totalPrice,
      imageUrl: product.imageUrl,
    }

    for (let i = 0; i < quantity; i++) {
      addItem(itemToAdd)
    }

    // Réinitialiser
    setQuantity(1)
    setSelectedExtras({})
  }

  // const handleApplyPromocode = () => {
  //   if (promocode.trim()) {
  //     setAppliedPromocode(promocode.trim())
  //     setPromocode('')
  //   }
  // }

  // const handleRemovePromocode = () => {
  //   setAppliedPromocode(null)
  // }

  // const handleConfirmOrder = () => {
  //   if (items.length === 0) return
  //   // Naviguer vers la page d'accueil et ouvrir la modal checkout
  //   navigate('/')
  //   setTimeout(() => {
  //     openModal('checkout')
  //   }, 100)
  // }

  // Calculer le total avec discount
  // const subtotal = getTotal()
  // const discount = appliedPromocode ? subtotal * 0.1 : 0 // 10% de réduction
  // const delivery = 0 // FREE
  // const total = subtotal - discount + delivery

  // Options de taille depuis les extras
  const sizeOptions = product?.extras 
    ? product.extras.filter(e => /g|kg/i.test(e.name)).map(e => e.name)
    : ['380g', '480g', '560g']

  // Options "Build Your Meal" (autres extras qui ne sont pas des tailles)
  const mealOptions = product?.extras
    ? product.extras.filter(e => !/g|kg/i.test(e.name))
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600">Produit non trouvé</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Bouton panier flottant */}
      {getItemCount() > 0 && (
        <button
          onClick={() => openModal('cart')}
          className="fixed bottom-24 md:bottom-6 right-6 bg-faata-red text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 z-40 hover:bg-red-700 transition-colors text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Panier</span>
          <span className="bg-white text-faata-red rounded-full px-1.5 py-0.5 text-xs font-bold">
            {getItemCount()}
          </span>
        </button>
      )}
      
      <div className="container mx-auto px-4 py-5">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image produit */}
            <div>
              <div className="relative" style={{ aspectRatio: '160 / 191', paddingBottom: 'calc(191 / 160 * 100%)' }}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 rounded-2xl flex items-center justify-center">
                    <span className="text-5xl">🍽️</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations produit */}
            <div>
              <div className="text-xl font-semibold mb-2">
                {((selectedSize && product.extras ? product.extras.find(e => e.name === selectedSize)?.price || product.price : product.price) * quantity).toLocaleString('fr-FR')} FCFA
              </div>
              <h3 className="text-lg font-medium mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-xs text-gray-600 mt-1 mb-4">{product.description}</p>
              )}

              {/* Options SIZE */}
              {sizeOptions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">SIZE</h4>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? 'bg-gray-900 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Build Your Meal */}
              {mealOptions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">BUILD YOUR MEAL</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {mealOptions.map((extra, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedExtras(prev => ({
                          ...prev,
                          [extra.name]: !prev[extra.name]
                        }))}
                        className={`p-2 border rounded-lg transition-colors ${
                          selectedExtras[extra.name]
                            ? 'border-faata-red bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded mx-auto mb-1 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                        <p className="text-xs text-center">{extra.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Quantity</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    aria-label="Decrement quantity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    className="w-16 text-center text-sm font-medium border border-gray-300 rounded-lg py-1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    readOnly
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    aria-label="Increment quantity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bouton ajouter au panier */}
              <button
                onClick={handleAddToOrder}
                className="w-full bg-faata-red hover:bg-red-700 text-white py-3 px-6 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal panier */}
      <CartModal />
    </div>
  )
}

