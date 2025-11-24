import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { productsAPI } from '../../lib/api'
import Modal from '../ui/Modal'
import { getProductImage } from '../../lib/productImages'

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  preparationTime?: number
  deliveryTime?: number
}

export function ProductsModal() {
  const { currentModal, closeModal, openModal, selectedCategory } = useModalStore()
  const { addItem, getItemCount } = useCartStore()
  const navigate = useNavigate()
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
    closeModal()
    navigate(`/product/${productId}`)
  }

  const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()

    const imageUrl = getProductImage(product)
    const itemToAdd = {
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl,
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
    <>
      {/* Bouton panier flottant visible */}
      {getItemCount() > 0 && (
        <button
          onClick={() => {
            closeModal()
            setTimeout(() => openModal('cart'), 100)
          }}
          className="fixed bottom-24 md:bottom-6 right-6 bg-faata-red text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 z-50 hover:bg-red-700 transition-colors text-xs"
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
      <Modal isOpen={currentModal === 'products'} onClose={closeModal} size="xl">
      {/* Bouton retour */}
      <div className="mb-6">
        <button
          onClick={() => openModal('categories')}
          className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Retour aux catégories</span>
        </button>
      </div>

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

      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="bg-white rounded-xl p-0 text-left transition-all duration-200 hover:shadow-lg overflow-hidden group border border-gray-100"
                >
                  {/* Image produit */}
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative shadow-xl ring-2 ring-gray-200/50 group-hover:ring-orange-300/70 group-hover:shadow-2xl transition-all duration-300">
                    {(() => {
                      const imageSrc = getProductImage(product)
                      if (imageSrc) {
                        return (
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 brightness-105 contrast-105"
                          />
                        )
                      }
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )
                    })()}
                    {/* Overlay gradient pour plus de profondeur */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Contenu texte */}
                  <div className="p-4">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {/* Temps de livraison */}
                    {(product.preparationTime || product.deliveryTime) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {(product.preparationTime || 0) + (product.deliveryTime || 0)} min
                        </span>
                      </div>
                    )}

                    {/* Prix et bouton + */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base font-bold text-gray-900">
                        {product.price.toLocaleString('fr-FR')} CFA
                      </span>
                      
                      <button
                        onClick={(e) => handleQuickAddToCart(e, product)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          addedProducts.has(product._id)
                            ? 'bg-green-500'
                            : 'bg-orange-500 hover:bg-orange-600'
                        } shadow-sm hover:shadow-md flex-shrink-0`}
                      >
                        {addedProducts.has(product._id) ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      </Modal>
    </>
  )
}
