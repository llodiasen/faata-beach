import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { ordersAPI } from '../../lib/api'
import Modal from '../ui/Modal'

interface Order {
  _id: string
  status: string
  totalAmount: number
  items: Array<{ name: string; quantity: number; price: number }>
  orderType?: string
  createdAt: string
}

export function OrderTrackingModal() {
  const { currentModal, closeModal, selectedOrder } = useModalStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentModal === 'orderTracking' && selectedOrder) {
      loadOrder()
      // Polling toutes les 5 secondes pour mettre à jour le statut
      const interval = setInterval(loadOrder, 5000)
      return () => clearInterval(interval)
    }
  }, [currentModal, selectedOrder])

  const loadOrder = async () => {
    if (!selectedOrder) return
    try {
      const data = await ordersAPI.getById(selectedOrder)
      setOrder(data)
      setLoading(false)
    } catch (error) {
      console.error('Erreur chargement commande:', error)
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    const baseSteps = [
      { key: 'pending', label: 'En attente', icon: '⏳' },
      { key: 'accepted', label: 'Acceptée', icon: '✅' },
      { key: 'preparing', label: 'En préparation', icon: '👨‍🍳' },
      { key: 'ready', label: 'Prête', icon: '🍽️' },
    ]

    if (order?.orderType === 'livraison') {
      return [
        ...baseSteps,
        { key: 'assigned', label: 'Livreur assigné', icon: '🚚' },
        { key: 'on_the_way', label: 'En route', icon: '🛣️' },
        { key: 'delivered', label: 'Livrée', icon: '🎉' }
      ]
    }
    
    return [
      ...baseSteps,
      { key: 'completed', label: 'Terminée', icon: '🎉' }
    ]
  }

  const getCurrentStepIndex = () => {
    if (!order) return -1
    const steps = getStatusSteps()
    const stepIndex = steps.findIndex(step => step.key === order.status)
    // Si le statut est 'completed' mais pas dans les steps de livraison, le considérer comme 'ready'
    if (stepIndex === -1 && order.status === 'completed') {
      return steps.length - 1
    }
    return stepIndex
  }

  if (!selectedOrder) return null

  const steps = getStatusSteps()
  const currentStepIndex = getCurrentStepIndex()

  return (
    <Modal isOpen={currentModal === 'orderTracking'} onClose={closeModal} title="Suivi de commande" size="md">
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : !order ? (
        <div className="text-center py-8 text-red-600">Commande non trouvée</div>
      ) : (
        <div className="space-y-6">
          {/* Timeline */}
          <div className="relative">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-start gap-4 mb-6">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  index <= currentStepIndex
                    ? 'bg-faata-red text-white shadow-lg'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {index < currentStepIndex ? '✓' : step.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${
                    index <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {index < steps.length - 1 && (
                    <div className={`h-8 w-0.5 ml-5 mt-2 transition-colors ${
                      index < currentStepIndex ? 'bg-faata-red' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Détails */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600">Commande #{order._id.slice(-6)}</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Total:</span>
              <span className="text-lg font-bold text-faata-red">
                {order.totalAmount.toLocaleString('fr-FR')} CFA
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <p className="font-semibold text-gray-900 mb-2">Articles:</p>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{item.price.toLocaleString('fr-FR')} CFA</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

