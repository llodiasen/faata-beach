import { useEffect, useState, useRef } from 'react'
import { useModalStore } from '../../store/useModalStore'
import { ordersAPI } from '../../lib/api'
import { useGeolocation } from '../../hooks/useGeolocation'
import Modal from '../ui/Modal'
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

interface Order {
  _id: string
  status: string
  totalAmount: number
  customerInfo: { name: string; phone: string; email?: string }
  deliveryAddress?: {
    fullAddress: string
    coordinates?: { lat: number; lng: number }
  }
  items: Array<{ name: string; quantity: number; price: number }>
  createdAt: string
}

export function DeliveryTrackingModal() {
  const { currentModal, closeModal, selectedOrder } = useModalStore()
  const { getCurrentLocation } = useGeolocation()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([])
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (currentModal === 'deliveryTracking' && selectedOrder) {
      loadOrder()
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
        trackingIntervalRef.current = null
      }
    }
  }, [currentModal, selectedOrder])

  useEffect(() => {
    if (order && deliveryLocation && order.deliveryAddress?.coordinates) {
      fetchRoute()
    }
  }, [order, deliveryLocation])

  const loadOrder = async () => {
    try {
      const data = await ordersAPI.getById(selectedOrder!)
      setOrder(data)
      startTracking()
    } catch (error) {
      console.error('Erreur chargement commande:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTracking = async () => {
    // Récupérer la position initiale du livreur
    try {
      const address = await getCurrentLocation()
      if (address?.coordinates) {
        setDeliveryLocation(address.coordinates)
      }
    } catch (error) {
      console.error('Erreur position initiale:', error)
    }

    // Mettre à jour la position toutes les 10 secondes
    trackingIntervalRef.current = setInterval(async () => {
      try {
        const address = await getCurrentLocation()
        if (address?.coordinates) {
          setDeliveryLocation(address.coordinates)
        }
      } catch (error) {
        console.error('Erreur tracking position:', error)
      }
    }, 10000) // Mise à jour toutes les 10 secondes
  }

  const fetchRoute = async () => {
    if (!deliveryLocation || !order?.deliveryAddress?.coordinates) return

    try {
      // Utiliser l'API de routing OSRM (Open Source Routing Machine)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${deliveryLocation.lng},${deliveryLocation.lat};${order.deliveryAddress.coordinates.lng},${order.deliveryAddress.coordinates.lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates
        // Convertir de [lng, lat] à [lat, lng] pour Leaflet
        const routePoints: [number, number][] = coordinates.map((coord: number[]) => [coord[1], coord[0]])
        setRoutePolyline(routePoints)
      }
    } catch (error) {
      console.error('Erreur calcul route:', error)
    }
  }

  if (!order || loading) {
    return (
      <Modal isOpen={currentModal === 'deliveryTracking'} onClose={closeModal} title="Suivi de livraison" size="xl">
        <div className="text-center py-8">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </Modal>
    )
  }

  const destination = order.deliveryAddress?.coordinates

  // Calculer le centre de la carte
  const mapCenter: [number, number] = destination
    ? [destination.lat, destination.lng]
    : deliveryLocation
    ? [deliveryLocation.lat, deliveryLocation.lng]
    : [14.7167, -17.4677] // Dakar par défaut

  // Calculer le zoom optimal
  const zoom = deliveryLocation && destination ? 13 : destination ? 15 : 12

  // Calculer la distance
  const distance =
    deliveryLocation && destination
      ? calculateDistance(
          deliveryLocation.lat,
          deliveryLocation.lng,
          destination.lat,
          destination.lng
        )
      : null

  return (
    <Modal isOpen={currentModal === 'deliveryTracking'} onClose={closeModal} title="Suivi de livraison" size="xl">
      <div className="space-y-6">
        {/* Informations de la commande */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-gray-900">Commande #{order._id.slice(-6)}</p>
              <p className="text-sm text-gray-600 mt-1">{order.customerInfo.name}</p>
              <p className="text-xs text-gray-500 mt-1">{order.customerInfo.phone}</p>
            </div>
            <p className="text-lg font-bold text-faata-red">{order.totalAmount.toLocaleString('fr-FR')} CFA</p>
          </div>

          {order.deliveryAddress && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Adresse de livraison</p>
              <p className="text-sm text-gray-900 font-medium">{order.deliveryAddress.fullAddress}</p>
            </div>
          )}
        </div>

        {/* Carte interactive */}
        <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Marker position du livreur */}
            {deliveryLocation && (
              <Marker position={[deliveryLocation.lat, deliveryLocation.lng]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">📍 Votre position</p>
                    <p className="text-xs text-gray-600">
                      {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marker destination */}
            {destination && (
              <Marker position={[destination.lat, destination.lng]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">🏠 Destination</p>
                    <p className="text-xs text-gray-600">{order.deliveryAddress?.fullAddress}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Ligne de route */}
            {routePolyline.length > 0 && (
              <Polyline
                positions={routePolyline}
                pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7 }}
              />
            )}
          </MapContainer>
        </div>

        {/* Informations de position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Position du livreur */}
          {deliveryLocation && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-lg">📍</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Votre position</p>
                  <p className="text-xs text-gray-600">
                    {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Distance estimée */}
          {distance !== null && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">📏</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Distance restante</p>
                  <p className="text-xs text-gray-600">{distance.toFixed(1)} km</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {destination && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                const originParam = deliveryLocation
                  ? `${deliveryLocation.lat},${deliveryLocation.lng}`
                  : ''
                const url = deliveryLocation
                  ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destination.lat},${destination.lng}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`
                window.open(url, '_blank')
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Ouvrir dans Google Maps
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

