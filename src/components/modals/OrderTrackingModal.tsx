import { useEffect, useState, useRef } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { ordersAPI } from '../../lib/api'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

// Icône personnalisée pour livreur
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
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
  const [customTip, setCustomTip] = useState('')
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
      preparing: 20,
      ready: 15,
      assigned: 12,
      on_the_way: 5,
      delivered: 0,
      cancelled: 0,
    }
    setEstimatedTime(timeByStatus[status] || 15)
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'En attente de confirmation',
      accepted: 'Commande acceptée',
      preparing: 'En préparation',
      ready: 'Prête à être récupérée',
      assigned: 'Livreur assigné',
      on_the_way: 'En route vers vous',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    }
    return statusMap[status] || 'En cours'
  }

  const getDeliveryPartnerMessage = (status: string) => {
    if (status === 'assigned' || status === 'on_the_way') {
      return 'Votre livreur attend de récupérer votre commande'
    }
    if (status === 'preparing') {
      return 'Votre commande est en cours de préparation'
    }
    return 'Votre commande sera bientôt préparée'
  }

  const handleTipSelection = (amount: number | 'custom') => {
    if (amount === 'custom') {
      // Gérer le tip personnalisé
      return
    }
    setTipAmount(amount)
    // TODO: Envoyer le tip au serveur
  }

  const handleChatWithDriver = () => {
    // TODO: Implémenter le chat avec le livreur
    if (order?.assignedDeliveryId && typeof order.assignedDeliveryId === 'object') {
      const driver = order.assignedDeliveryId
      const phoneNumber = driver.phone || ''
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

  // Calculer les bounds pour centrer la carte
  const getMapBounds = () => {
    if (!deliveryCoords) return restaurantCoords
    return [
      [
        Math.min(restaurantCoords[0], deliveryCoords[0]) - 0.01,
        Math.min(restaurantCoords[1], deliveryCoords[1]) - 0.01,
      ],
      [
        Math.max(restaurantCoords[0], deliveryCoords[0]) + 0.01,
        Math.max(restaurantCoords[1], deliveryCoords[1]) + 0.01,
      ],
    ]
  }

  if (!selectedOrder) return null

  const deliveryPartner = order?.assignedDeliveryId && typeof order.assignedDeliveryId === 'object'
    ? order.assignedDeliveryId
    : null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 h-screen z-50 bg-white flex flex-col">
      {/* Header bleu clair */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-500 px-4 pt-12 pb-6 flex-shrink-0 text-white relative overflow-hidden">
        {/* Motifs décoratifs en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Contenu header */}
        <div className="relative z-10">
          {/* Boutons header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={closeModal}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Nom restaurant et statut */}
          <h1 className="text-2xl font-bold mb-1">FAATA Beach</h1>
          <p className="text-lg opacity-90">{getStatusText(order?.status || 'pending')}</p>

          {/* Badge temps d'arrivée */}
          <div className="flex items-center gap-3 mt-4">
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
            <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Barre info livreur */}
      {order?.orderType === 'livraison' && (
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
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
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}

      {/* Carte interactive */}
      {order?.orderType === 'livraison' && deliveryCoords && (
        <div className="flex-1 relative min-h-[300px]">
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

          {/* Bouton agrandir carte */}
          <button className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-10 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

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
        <div className="bg-white px-4 py-6 flex-shrink-0 border-t border-gray-200">
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
          <div className="text-center mb-4">
            <p className="text-gray-700 font-medium mb-4">Faites plaisir en laissant un pourboire</p>
            <div className="flex gap-3 justify-center mb-4">
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

          {/* Lien sécurité */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-100">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>En savoir plus sur la sécurité des livreurs</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Contenu alternatif pour les commandes non-livraison */}
      {order && order.orderType !== 'livraison' && (
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
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
    </div>
  )
}
