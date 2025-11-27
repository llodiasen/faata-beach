import { useState, useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import { useModalStore } from '../../store/useModalStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { DeliveryTimePicker } from '../ui/DeliveryTimePicker'

type OrderType = 'sur_place' | 'reservation' | 'livraison'

interface OrderTypeModalProps {
  currentOrderType: OrderType
  onOrderTypeChange: (type: OrderType, data?: {
    reservationGuests?: number
    reservationDateTime?: Date | null
    deliveryAddress?: string
    deliveryScheduledDateTime?: Date | null
  }) => void
  onScheduleModeChange?: (mode: 'livraison' | 'reservation') => void
}

export function OrderTypeModal({ currentOrderType, onOrderTypeChange, onScheduleModeChange }: OrderTypeModalProps) {
  const { currentModal, closeModal, openModal } = useModalStore()
  const { getCurrentLocation, loading: geolocationLoading } = useGeolocation()
  const [selectedType, setSelectedType] = useState<OrderType>(currentOrderType)
  const [reservationGuests, setReservationGuests] = useState<number>(0)
  const [reservationDateTime, setReservationDateTime] = useState<Date | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryScheduledDateTime, setDeliveryScheduledDateTime] = useState<Date | null>(null)
  const [requestingLocation, setRequestingLocation] = useState(false)
  const [hasClickedSchedule, setHasClickedSchedule] = useState(false)
  const hasRequestedLocation = useRef(false)

  const isOpen = currentModal === 'orderType'

  // Réinitialiser les états quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setHasClickedSchedule(false)
      return
    }

    // Charger les détails de réservation
    const savedReservation = localStorage.getItem('faata_reservationDetails')
    if (savedReservation) {
      try {
        const data = JSON.parse(savedReservation)
        if (typeof data.guestCount === 'number') {
          setReservationGuests(data.guestCount)
        }
        if (data.scheduledDateTime) {
          setReservationDateTime(new Date(data.scheduledDateTime))
        }
      } catch (error) {
        // ignore parse errors
      }
    }

    // Charger l'adresse de livraison
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const data = JSON.parse(savedAddress)
        if (data.fullAddress) {
          setDeliveryAddress(data.fullAddress)
        }
        if (data.scheduledDateTime) {
          setDeliveryScheduledDateTime(new Date(data.scheduledDateTime))
        }
      } catch (error) {
        // ignore parse errors
      }
    }
  }, [isOpen])

  // Détecter la géolocalisation pour la livraison
  useEffect(() => {
    if (selectedType === 'livraison' && !deliveryAddress && !requestingLocation && !geolocationLoading && !hasRequestedLocation.current && isOpen) {
      hasRequestedLocation.current = true
      setRequestingLocation(true)
      getCurrentLocation()
        .then((address) => {
          setDeliveryAddress(address.fullAddress)
          setRequestingLocation(false)
        })
        .catch((error) => {
          console.error('Erreur géolocalisation:', error)
          setRequestingLocation(false)
          hasRequestedLocation.current = false
        })
    }
  }, [selectedType, deliveryAddress, requestingLocation, geolocationLoading, isOpen, getCurrentLocation])

  const handleConfirm = () => {
    if (selectedType === 'sur_place') {
      onOrderTypeChange('sur_place')
      closeModal()
      return
    }

    if (selectedType === 'reservation') {
      if (!reservationGuests || reservationGuests < 1) {
        alert('Veuillez saisir le nombre de personnes')
        return
      }
      if (!reservationDateTime) {
        alert('Veuillez sélectionner un créneau pour la réservation')
        return
      }
      setHasClickedSchedule(false) // Réinitialiser après confirmation
      onOrderTypeChange('reservation', {
        reservationGuests: reservationGuests,
        reservationDateTime
      })
      // Sauvegarder dans localStorage
      localStorage.setItem('faata_reservationDetails', JSON.stringify({
        guestCount: reservationGuests,
        scheduledDateTime: reservationDateTime ? reservationDateTime.toISOString() : null
      }))
      sessionStorage.setItem('faata_reservationDetails', JSON.stringify({
        guestCount: reservationGuests,
        scheduledDateTime: reservationDateTime ? reservationDateTime.toISOString() : null
      }))
      closeModal()
      return
    }

    if (selectedType === 'livraison') {
      if (!deliveryAddress.trim()) {
        alert('Veuillez saisir une adresse de livraison')
        return
      }
      if (hasClickedSchedule && !deliveryScheduledDateTime) {
        alert('Veuillez sélectionner un créneau pour la livraison')
        return
      }
      setHasClickedSchedule(false) // Réinitialiser après confirmation
      onOrderTypeChange('livraison', {
        deliveryAddress: deliveryAddress.trim(),
        deliveryScheduledDateTime
      })
      // Sauvegarder dans localStorage
      localStorage.setItem('faata_deliveryAddress', JSON.stringify({
        fullAddress: deliveryAddress.trim(),
        scheduledDateTime: deliveryScheduledDateTime ? deliveryScheduledDateTime.toISOString() : null
      }))
      closeModal()
      return
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Modifier le mode de commande"
      size="md"
      transparentOverlay={true}
    >
      <div className="space-y-6">
        {/* Sélection du type de commande */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Choisir un mode de commande</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedType('sur_place')}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                selectedType === 'sur_place'
                  ? 'border-[#39512a] bg-[#39512a]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-[#39512a]">Sur place</div>
              <div className="text-sm text-gray-600 mt-1">Consommation directe dans le restaurant</div>
            </button>

            <button
              onClick={() => setSelectedType('reservation')}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                selectedType === 'reservation'
                  ? 'border-[#39512a] bg-[#39512a]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-[#39512a]">Réservation table</div>
              <div className="text-sm text-gray-600 mt-1">Réserver une table à l'avance</div>
            </button>

            <button
              onClick={() => setSelectedType('livraison')}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                selectedType === 'livraison'
                  ? 'border-[#39512a] bg-[#39512a]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-[#39512a]">Livraison</div>
              <div className="text-sm text-gray-600 mt-1">Livraison à votre adresse</div>
            </button>
          </div>
        </div>

        {/* Options pour Réservation table */}
        {selectedType === 'reservation' && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <input
                type="number"
                min={1}
                value={reservationGuests === 0 ? '' : reservationGuests}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '') {
                    setReservationGuests(0)
                  } else {
                    const num = parseInt(val)
                    if (!isNaN(num) && num > 0) {
                      setReservationGuests(num)
                    }
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value || parseInt(e.target.value) < 1) {
                    setReservationGuests(2)
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] placeholder:text-gray-400"
                placeholder="Nombre de personnes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure
              </label>
              <DeliveryTimePicker
                value={reservationDateTime}
                onChange={setReservationDateTime}
                onScheduleClick={() => {
                  onScheduleModeChange?.('reservation')
                  openModal('scheduleTime')
                }}
                idleLabel="Sélectionner un créneau"
                nowOptionLabel="Réserver maintenant"
                scheduleOptionLabel="Programmer la réservation"
                selectedLabel="Créneau défini"
              />
              {!reservationDateTime && (
                <p className="text-sm text-red-500 mt-1">Veuillez sélectionner un créneau pour la réservation</p>
              )}
            </div>
          </div>
        )}

        {/* Options pour Livraison */}
        {selectedType === 'livraison' && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse de livraison
              </label>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                {geolocationLoading || requestingLocation ? (
                  <svg className="w-5 h-5 text-[#39512a] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                  </svg>
                )}
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={geolocationLoading || requestingLocation ? "Détection de votre position..." : "Saisir l'adresse de livraison"}
                  disabled={geolocationLoading || requestingLocation}
                  className="flex-1 bg-transparent focus:outline-none text-sm disabled:opacity-50"
                />
                {!geolocationLoading && !requestingLocation && (
                  <button
                    onClick={() => {
                      hasRequestedLocation.current = false
                      setRequestingLocation(true)
                      getCurrentLocation()
                        .then((address) => {
                          setDeliveryAddress(address.fullAddress)
                          setRequestingLocation(false)
                        })
                        .catch((error) => {
                          console.error('Erreur géolocalisation:', error)
                          setRequestingLocation(false)
                        })
                    }}
                    className="text-[#39512a] hover:text-[#2f3d1f] text-xs font-medium"
                  >
                    Détecter
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quand souhaitez-vous recevoir votre commande ?
              </label>
              <DeliveryTimePicker
                value={deliveryScheduledDateTime}
                onChange={(date) => {
                  setDeliveryScheduledDateTime(date)
                  if (date) {
                    setHasClickedSchedule(false) // Réinitialiser si une date est sélectionnée
                  }
                }}
                onScheduleClick={() => {
                  setHasClickedSchedule(true)
                  onScheduleModeChange?.('livraison')
                  openModal('scheduleTime')
                }}
              />
              {hasClickedSchedule && !deliveryScheduledDateTime && (
                <p className="text-sm text-red-500 mt-1">Veuillez sélectionner un créneau</p>
              )}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={closeModal}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-3 py-2 bg-[#39512a] hover:opacity-90 text-white rounded-lg font-medium transition-colors text-sm"
          >
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  )
}

