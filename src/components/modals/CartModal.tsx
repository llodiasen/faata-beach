import { useNavigate } from 'react-router-dom'
import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import Modal from '../ui/Modal'

export function CartModal() {
  const navigate = useNavigate()
  const { currentModal, closeModal } = useModalStore()
  const { items, updateQuantity, removeItem, getTotal } = useCartStore()

  const handleCheckout = () => {
    if (items.length === 0) return
    closeModal()
    navigate('/checkout')
  }

  const handleViewCart = () => {
    // Optionnel : peut ouvrir une vue détaillée du panier
    closeModal()
  }

  const subtotal = getTotal()

  return (
    <Modal isOpen={currentModal === 'cart'} onClose={closeModal} size="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Panier d'achat</h2>
        <button
          onClick={closeModal}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Items du panier */}
      <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">Votre panier est vide</p>
            <button
              onClick={() => {
                closeModal()
                navigate('/menu')
              }}
              className="px-6 py-3 bg-faata-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Ajouter des produits
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 relative">
              {/* Image produit */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent && !parent.querySelector('.image-fallback')) {
                        const fallback = document.createElement('div')
                        fallback.className = 'image-fallback w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center'
                        fallback.innerHTML = '<span class="text-3xl">🍽️</span>'
                        parent.appendChild(fallback)
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <span className="text-3xl">🍽️</span>
                  </div>
                )}
              </div>

              {/* Informations produit */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{item.name}</h3>
                <p className="text-sm text-gray-900 mb-3">
                  {item.price.toLocaleString('fr-FR')} F CFA
                </p>
                
                {/* Contrôles de quantité */}
                <div className="flex items-center gap-2 border border-gray-300 rounded-full px-2 py-1 w-fit">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-900 text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bouton supprimer */}
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                aria-label="Supprimer"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sous-total et boutons */}
      {items.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Sous-total */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-900">Sous Total:</span>
            <span className="text-sm font-bold text-gray-900">{subtotal.toLocaleString('fr-FR')} F CFA</span>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleViewCart}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
            >
              Voir panier
            </button>
            <button
              onClick={handleCheckout}
              className="w-full bg-faata-red hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Finaliser la commande
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
