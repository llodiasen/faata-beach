import { useEffect, useState, useRef } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { ordersAPI } from '../../lib/api'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Modal from '../ui/Modal'

// Fix pour les icônes Leaflet avec Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Icône personnalisée pour restaurant
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Icône personnalisée pour maison/destination
const homeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})


interface Order {
  _id: string
  status: string
  totalAmount: number
  items: Array<{ name: string; quantity: number; price: number }>
  orderType?: string
  createdAt: string
  deliveryAddress?: {
    fullAddress: string
    coordinates?: { lat: number; lng: number }
  }
  assignedDeliveryId?: string | {
    _id: string
    name: string
    phone?: string
  }
}

// Coordonnées du restaurant (à adapter selon votre localisation)
const RESTAURANT_COORDS: [number, number] = [14.7167, -17.4677] // Dakar par défaut

export function OrderTrackingModal() {
  const { currentModal, closeModal, selectedOrder } = useModalStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [estimatedTime, setEstimatedTime] = useState(15) // minutes
  const [tipAmount, setTipAmount] = useState<number | null>(null)
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (currentModal === 'orderTracking' && selectedOrder) {
      loadOrder()
      // Polling toutes les 5 secondes pour mettre à jour le statut
      trackingIntervalRef.current = setInterval(loadOrder, 5000)
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
        trackingIntervalRef.current = null
      }
    }
  }, [currentModal, selectedOrder])

  const loadOrder = async () => {
    if (!selectedOrder) return
    try {
      const data = await ordersAPI.getById(selectedOrder)
      setOrder(data)
      setLoading(false)
      
      // Calculer le temps estimé selon le statut
      calculateEstimatedTime(data.status)
    } catch (error) {
      console.error('Erreur chargement commande:', error)
      setLoading(false)
    }
  }

  const calculateEstimatedTime = (status: string) => {
    // Temps estimés selon le statut (en minutes)
    const timeByStatus: Record<string, number> = {
      pending: 30,
      accepted: 25,
      assigned: 20,
      on_the_way: 10,
      delivered: 0,
      cancelled: 0,
    }
    setEstimatedTime(timeByStatus[status] || 15)
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Commandée',
      assigned: 'Assignée à un livreur',
      on_the_way: 'En route',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    }
    return statusMap[status] || 'En attente'
  }

  const getDeliveryPartnerMessage = (status: string) => {
    if (status === 'assigned' || status === 'on_the_way') {
      return 'Votre livreur est en route'
    }
    return 'En attente de livreur'
  }

  const handleTipSelection = (amount: number | 'custom') => {
    if (amount === 'custom') {
      // TODO: Ouvrir un modal pour saisir un montant personnalisé
      const customAmount = prompt('Montant du pourboire (CFA):')
      if (customAmount) {
        const numAmount = parseInt(customAmount, 10)
        if (!isNaN(numAmount) && numAmount > 0) {
          setTipAmount(numAmount)
        }
      }
    } else {
      setTipAmount(amount)
    }
  }

  const handleChatWithDriver = () => {
    if (order?.assignedDeliveryId && typeof order.assignedDeliveryId === 'object') {
      const phoneNumber = order.assignedDeliveryId.phone
      if (phoneNumber) {
        window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}`, '_blank')
      }
    }
  }

  // Coordonnées pour la carte
  const restaurantCoords: [number, number] = RESTAURANT_COORDS
  const deliveryCoords = order?.deliveryAddress?.coordinates
    ? [order.deliveryAddress.coordinates.lat, order.deliveryAddress.coordinates.lng] as [number, number]
    : null

  if (!selectedOrder) return null

  const deliveryPartner = order?.assignedDeliveryId && typeof order.assignedDeliveryId === 'object'
    ? order.assignedDeliveryId
    : null

  return (
    <Modal isOpen={currentModal === 'orderTracking'} onClose={closeModal} size="xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Chargement...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header bleu clair */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 px-4 py-6 rounded-t-lg -mx-6 -mt-6 text-white relative overflow-hidden">
            {/* Motifs décoratifs en arrière-plan */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
            </div>

            {/* Contenu header */}
            <div className="relative z-10">
              {/* Nom restaurant et statut */}
              <h1 className="text-2xl font-bold mb-1">FAATA Beach</h1>
              <p className="text-lg opacity-90 mb-4">{getStatusText(order?.status || 'pending')}</p>

              {/* Badge temps d'arrivée */}
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">
                    {estimatedTime > 0 ? `Arrivée dans ${estimatedTime} min` : 'Livrée'}
                  </span>
                  {estimatedTime > 0 && (
                    <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full">À l'heure</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barre info livreur */}
          {order?.orderType === 'livraison' && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 flex-1">
                  {getDeliveryPartnerMessage(order?.status || 'pending')}
                </p>
              </div>
            </div>
          )}

          {/* Carte interactive */}
          {order?.orderType === 'livraison' && deliveryCoords && (
            <div className="relative h-96 rounded-xl overflow-hidden border border-gray-200">
              <MapContainer
                center={[(restaurantCoords[0] + deliveryCoords[0]) / 2, (restaurantCoords[1] + deliveryCoords[1]) / 2]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {/* Marker restaurant */}
                <Marker position={restaurantCoords} icon={restaurantIcon}>
                  <Popup>FAATA Beach</Popup>
                </Marker>

                {/* Marker destination */}
                <Marker position={deliveryCoords} icon={homeIcon}>
                  <Popup>Destination</Popup>
                </Marker>

                {/* Ligne de route */}
                <Polyline
                  positions={[restaurantCoords, deliveryCoords]}
                  color="#3b82f6"
                  weight={4}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              </MapContainer>

              {/* Bouton localisation */}
              <button className="absolute bottom-4 right-4 bg-red-500 rounded-full shadow-lg p-3 z-10 hover:bg-red-600 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}

          {/* Section livreur et pourboire */}
          {order?.orderType === 'livraison' && deliveryPartner && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              {/* Infos livreur */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{deliveryPartner.name} est votre livreur</p>
                  </div>
                </div>
                <button
                  onClick={handleChatWithDriver}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  CHAT NOW
                </button>
              </div>

              {/* Section pourboire */}
              <div className="text-center">
                <p className="text-gray-700 font-medium mb-4">Faites plaisir en laissant un pourboire</p>
                <div className="flex gap-3 justify-center mb-4 flex-wrap">
                  {[500, 1000, 1500, 2000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleTipSelection(amount)}
                      className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                        tipAmount === amount
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {amount.toLocaleString('fr-FR')} CFA
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleTipSelection('custom')}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Autre montant
                </button>
              </div>
            </div>
          )}

          {/* Contenu alternatif pour les commandes non-livraison */}
          {order && order.orderType !== 'livraison' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Commande #{order._id.slice(-6)}</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Total:</span>
                  <span className="text-lg font-bold text-faata-red">
                    {order.totalAmount.toLocaleString('fr-FR')} CFA
                  </span>
                </div>
              </div>
              <div>
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
        </div>
      )}
    </Modal>
  )
}
