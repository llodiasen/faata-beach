import { useModalStore } from '../../store/useModalStore'
import { useCartStore } from '../../store/useCartStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export function CartModal() {
  const { currentModal, closeModal, openModal } = useModalStore()
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()

  const handleCheckout = () => {
    if (items.length === 0) return
    openModal('checkout')
  }

  return (
    <Modal isOpen={currentModal === 'cart'} onClose={closeModal} title="Mon panier" size="lg">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">Votre panier est vide</p>
          <Button variant="primary" onClick={() => openModal('categories')}>
            Voir les catégories
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-faata-red font-bold">{item.price.toLocaleString('fr-FR')} CFA</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                    aria-label="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-faata-red">{getTotal().toLocaleString('fr-FR')} CFA</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => openModal('categories')} className="flex-1">
              Continuer les achats
            </Button>
            <Button variant="primary" onClick={handleCheckout} className="flex-1">
              Commander
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

