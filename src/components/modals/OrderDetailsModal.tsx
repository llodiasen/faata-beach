import { useEffect, useState } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { ordersAPI } from '../../lib/api'
import Modal from '../ui/Modal'

interface OrderItem {
  name: string
  quantity: number
  price: number
  productId?: any
}

interface Order {
  _id: string
  status: string
  totalAmount: number
  customerInfo: { name: string; phone: string; email?: string }
  items: OrderItem[]
  orderType?: string
  deliveryAddress?: any
  createdAt: string
  assignedDeliveryId?: string
}

export function OrderDetailsModal() {
  const { currentModal, closeModal, selectedOrder } = useModalStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!selectedOrder) return

      try {
        setLoading(true)
        const data = await ordersAPI.getById(selectedOrder)
        setOrder(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (currentModal === 'orderDetails' && selectedOrder) {
      fetchOrder()
    }
  }, [currentModal, selectedOrder])

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-800' },
      preparing: { bg: 'bg-purple-100', text: 'text-purple-800' },
      ready: { bg: 'bg-green-100', text: 'text-green-800' },
      assigned: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      on_the_way: { bg: 'bg-orange-100', text: 'text-orange-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    }
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      preparing: 'En préparation',
      ready: 'Prête',
      assigned: 'Assignée',
      on_the_way: 'En route',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    }
    return labels[status] || status
  }

  return (
    <Modal isOpen={currentModal === 'orderDetails'} onClose={closeModal} title="Détails de la commande">
      {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
      {error && <div className="text-red-600 text-center py-4">{error}</div>}
      {!loading && !error && order && (
        <div className="space-y-6">
          {/* Informations commande */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Commande #{order._id.slice(-6)}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Informations client */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Informations client</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900"><strong>Nom:</strong> {order.customerInfo?.name || 'Non renseigné'}</p>
              <p className="text-sm text-gray-900"><strong>Téléphone:</strong> {order.customerInfo?.phone || 'Non renseigné'}</p>
              {order.customerInfo?.email && (
                <p className="text-sm text-gray-900"><strong>Email:</strong> {order.customerInfo.email}</p>
              )}
            </div>
          </div>

          {/* Type de commande */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Type de commande</h4>
            <p className="text-sm text-gray-600">
              {order.orderType === 'sur_place' ? 'Sur place' : order.orderType === 'emporter' ? 'À emporter' : order.orderType === 'livraison' ? 'Livraison' : order.orderType || 'Non spécifié'}
            </p>
            {order.deliveryAddress && (
              <div className="mt-2 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900"><strong>Adresse de livraison:</strong></p>
                <p className="text-sm text-gray-600">
                  {typeof order.deliveryAddress === 'string' 
                    ? order.deliveryAddress 
                    : order.deliveryAddress.fullAddress || JSON.stringify(order.deliveryAddress)}
                </p>
              </div>
            )}
          </div>

          {/* Articles */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Articles</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-faata-red">
                {order.totalAmount.toLocaleString('fr-FR')} CFA
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

