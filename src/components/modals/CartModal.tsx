import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import Modal from '../ui/Modal'

export function CartModal() {
  const { currentModal, closeModal, openModal } = useModalStore()
  const { items, updateQuantity, getTotal } = useCartStore()

  const handleCheckout = () => {
    if (items.length === 0) return
    closeModal()
    openModal('checkout')
  }

  const handleAddMore = () => {
    closeModal()
    openModal('categories')
  }

  const subtotal = getTotal()
  const tax = subtotal * 0.1 // 10% de taxe
  const total = subtotal + tax

  // Récupérer l'adresse depuis localStorage
  const getDeliveryAddress = () => {
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const address = JSON.parse(savedAddress)
        return address.fullAddress || '1234 Address Blvd'
      } catch (e) {
        return '1234 Address Blvd'
      }
    }
    return '1234 Address Blvd'
  }

  return (
    <Modal isOpen={currentModal === 'cart'} onClose={closeModal} size="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 -mt-2">
        <h2 className="text-xl font-bold text-gray-900">Cart</h2>
      </div>

      {/* Adresse de livraison */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm text-gray-700">{getDeliveryAddress()}</span>
      </div>

      {/* Items du panier */}
      <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">Votre panier est vide</p>
            <button
              onClick={handleAddMore}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Ajouter des produits
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Image produit */}
              {item.imageUrl ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-xl ring-2 ring-orange-200/50 flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover brightness-105 contrast-105"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shadow-xl ring-2 ring-gray-300/50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Informations produit */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                <p className="text-base font-bold text-teal-600 mb-2">
                  {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                </p>
              </div>

              {/* Contrôles de quantité */}
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 font-bold transition-colors"
                >
                  -
                </button>
                <span className="w-6 text-center font-semibold text-gray-900">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Section "Need anything else?" */}
      {items.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <span className="text-sm text-gray-700">Need anything else?</span>
          <button
            onClick={handleAddMore}
            className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            +Add More
          </button>
        </div>
      )}

      {/* Section Summary */}
      {items.length > 0 && (
        <>
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">{subtotal.toLocaleString('fr-FR')} CFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold text-gray-900">{tax.toLocaleString('fr-FR')} CFA</span>
              </div>
            </div>
          </div>

          {/* Section Payment */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.8" />
                  <circle cx="12" cy="12" r="6" fill="white" opacity="0.9" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-medium">.... .... .... 5678</span>
            </div>
          </div>

          {/* Total et bouton Checkout */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">{total.toLocaleString('fr-FR')} CFA</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
