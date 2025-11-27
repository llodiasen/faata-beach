import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import { categoriesAPI, productsAPI } from '../../lib/api'
import { getProductImage } from '../../lib/productImages'
import Modal from '../ui/Modal'

interface Category {
  _id: string
  name: string
  imageUrl?: string
}

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  categoryId?: any
}

export function MenuModal() {
  const { currentModal, closeModal, setSelectedProduct, openModal } = useModalStore()
  const { addItem } = useCartStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [categoriesData, productsData] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll()
        ])
        setCategories(categoriesData)
        setProducts(productsData)
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (currentModal === 'menu') {
      fetchData()
    }
  }, [currentModal])

  const filteredProducts = selectedCategory
    ? products.filter(product => {
        const productCategoryId = typeof product.categoryId === 'object' 
          ? product.categoryId?._id?.toString() 
          : product.categoryId?.toString()
        return productCategoryId === selectedCategory
      })
    : products

  const handleProductClick = (productId: string) => {
    setSelectedProduct(productId)
    closeModal()
    openModal('productDetail')
  }

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    const imageUrl = getProductImage(product)
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl,
    }, 1)
  }

  const formatPrice = (price: number) => price.toLocaleString('fr-FR')

  return (
    <Modal 
      isOpen={currentModal === 'menu'} 
      onClose={closeModal} 
      size="xl" 
      transparentOverlay
      heroBackground="http://wasafrica.org/wp-content/uploads/2025/11/96444e8b6107fad5-scaled.webp"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39512a] mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du menu...</p>
          </div>
        ) : (
          <>
            {/* Catégories */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#39512a] mb-4">Catégories</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === null
                      ? 'bg-[#39512a] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat._id
                        ? 'bg-[#39512a] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name.replace(/^Plats —\s*/, '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Produits */}
            <div>
              <h3 className="text-lg font-semibold text-[#39512a] mb-4">
                {selectedCategory 
                  ? categories.find(c => c._id === selectedCategory)?.name.replace(/^Plats —\s*/, '') || 'Produits'
                  : 'Tous les produits'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const imageUrl = getProductImage(product)
                  return (
                    <div
                      key={product._id}
                      className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleProductClick(product._id)}
                    >
                      <div className="relative h-32 bg-white flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="text-4xl">🍽️</div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-base font-medium text-[#39512a] mb-1">{product.name}</h4>
                        <p className="text-xs text-[#39512a] mb-2">{formatPrice(product.price)} FCFA</p>
                        <button
                          onClick={(e) => handleQuickAdd(e, product)}
                          className="w-full bg-[#39512a] hover:opacity-90 text-white py-1.5 rounded-lg text-xs font-medium transition-all"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

