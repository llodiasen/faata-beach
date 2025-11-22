import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/useCartStore'
import { useModalStore } from '../store/useModalStore'
import { productsAPI, categoriesAPI } from '../lib/api'
import Header from '../components/layout/Header'

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

interface Category {
  _id: string
  name: string
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, addItem, updateQuantity, getTotal } = useCartStore()
  const { openModal } = useModalStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({})
  const [quantity, setQuantity] = useState(1)
  const [promocode, setPromocode] = useState('')
  const [appliedPromocode, setAppliedPromocode] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const [productData, categoriesData] = await Promise.all([
          productsAPI.getById(id),
          categoriesAPI.getAll()
        ])
        
        setProduct(productData)
        setCategories(categoriesData)
        
        // Définir la catégorie sélectionnée
        if (productData.categoryId) {
          const categoryId = typeof productData.categoryId === 'string' 
            ? productData.categoryId 
            : productData.categoryId._id
          setSelectedCategory(categoryId)
        }
        
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

  const handleApplyPromocode = () => {
    if (promocode.trim()) {
      setAppliedPromocode(promocode.trim())
      setPromocode('')
    }
  }

  const handleRemovePromocode = () => {
    setAppliedPromocode(null)
  }

  const handleConfirmOrder = () => {
    if (items.length === 0) return
    // Naviguer vers la page d'accueil et ouvrir la modal checkout
    navigate('/')
    setTimeout(() => {
      openModal('checkout')
    }, 100)
  }

  // Calculer le total avec discount
  const subtotal = getTotal()
  const discount = appliedPromocode ? subtotal * 0.1 : 0 // 10% de réduction
  const delivery = 0 // FREE
  const total = subtotal - discount + delivery

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
      <div className="min-h-screen bg-gray-50">
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
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche - Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navigation catégories */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Meal Category</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category._id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category._id
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Détail produit */}
            <div className="bg-white rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image produit */}
                <div>
                  {product.imageUrl ? (
                    <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-orange-200/40 relative">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover brightness-105 contrast-110"
                      />
                      {/* Overlay gradient subtil */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                    </div>
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl shadow-2xl ring-4 ring-gray-300/40 flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Informations produit */}
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                  
                  {product.description && (
                    <p className="text-gray-600">{product.description}</p>
                  )}

                  {/* Options SIZE */}
                  {sizeOptions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">SIZE</h3>
                      <div className="flex gap-2">
                        {sizeOptions.map((size, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedSize === size
                                ? 'bg-black text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">BUILD YOUR MEAL</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {mealOptions.map((extra, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedExtras(prev => ({
                              ...prev,
                              [extra.name]: !prev[extra.name]
                            }))}
                            className={`relative p-3 border-2 rounded-lg transition-colors ${
                              selectedExtras[extra.name]
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <span className="text-2xl">🍽️</span>
                            </div>
                            <p className="text-xs text-center text-gray-700">{extra.name}</p>
                            {selectedExtras[extra.name] && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity et Add to order */}
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={handleAddToOrder}
                      className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-between hover:bg-gray-900 transition-colors"
                    >
                      <span>{((selectedSize && product.extras ? product.extras.find(e => e.name === selectedSize)?.price || product.price : product.price) * quantity).toLocaleString('fr-FR')} CFA</span>
                      <span>Add to order</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Pairings */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">RECOMMENDED PAIRINGS</h2>
              <div className="grid grid-cols-3 gap-4">
                {/* Placeholder pour les produits recommandés */}
                <div className="text-center text-gray-500 text-sm">
                  <p>Produits recommandés</p>
                  <p className="text-xs mt-2">À venir</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - Panier */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              {/* My Order */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">My Order</h2>
                  <span className="text-sm text-gray-500">{items.length} position{items.length > 1 ? 's' : ''}</span>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Votre panier est vide</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const basePrice = item.price
                      return (
                        <div key={item.id} className="border-2 border-dashed border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-xl ring-2 ring-orange-200/50 flex-shrink-0">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover brightness-105 contrast-105"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shadow-xl ring-2 ring-gray-300/50 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                              <p className="text-xs text-gray-500">380g</p>
                              <p className="text-sm font-bold text-gray-900 mt-1">{basePrice.toLocaleString('fr-FR')} CFA</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Promocode */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">PROMOCODE</h3>
                {appliedPromocode ? (
                  <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                    <span className="text-sm font-medium">{appliedPromocode}</span>
                    <button
                      onClick={handleRemovePromocode}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promocode}
                      onChange={(e) => setPromocode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={handleApplyPromocode}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">DISCOUNT</span>
                  <span className="font-semibold text-gray-900">
                    {appliedPromocode ? `-10%` : '0 CFA'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">DELIVERY</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>TOTAL</span>
                  <span>{total.toLocaleString('fr-FR')} CFA</span>
                </div>
              </div>

              {/* Confirm Order Button */}
              <button
                onClick={handleConfirmOrder}
                disabled={items.length === 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

