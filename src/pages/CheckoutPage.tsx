import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'
import { useModalStore } from '../store/useModalStore'
// import { useGeolocation } from '../hooks/useGeolocation' // Utilisé via LocationModal
import { ordersAPI } from '../lib/api'
import BottomNavigation from '../components/layout/BottomNavigation'
import { LocationModal } from '../components/modals/LocationModal'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotal, clearCart, removeItem } = useCartStore()
  const { user } = useAuthStore()
  // const { getCurrentLocation } = useGeolocation() // Utilisé via LocationModal
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Récupérer le type de commande depuis localStorage
  const getOrderType = (): 'sur_place' | 'reservation' | 'livraison' => {
    const savedOrderType = localStorage.getItem('faata_orderType')
    return (savedOrderType as 'sur_place' | 'reservation' | 'livraison') || 'livraison'
  }

  const orderType = getOrderType()

  // Récupérer l'adresse de livraison depuis localStorage si disponible
  const getDeliveryAddress = (): string => {
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const address = JSON.parse(savedAddress)
        return address.fullAddress || ''
      } catch (e) {
        return ''
      }
    }
    return ''
  }

  const extractZoneFromAddress = (fullAddress: string): string => {
    if (!fullAddress) return ''
    
    const addressUpper = fullAddress.toUpperCase()
    
    // Chercher des zones connues dans l'adresse (par ordre de priorité)
    const zones = [
      'Parcelles Assainies',
      'Grand Yoff',
      'BARGNY',
      'Yoff',
      'Ouakam',
      'Mermoz',
      'Almadies',
      'Dakar'
    ]
    
    for (const zone of zones) {
      if (addressUpper.includes(zone.toUpperCase())) {
        return zone
      }
    }
    
    // Si aucune zone connue n'est trouvée, extraire la ville depuis l'adresse
    // Les adresses sont généralement formatées: rue, quartier, commune, arrondissement, ville, région
    const parts = fullAddress.split(',').map(p => p.trim()).filter(p => p.length > 0)
    if (parts.length > 0) {
      // Prendre généralement la ville qui est souvent dans les dernières parties
      // Chercher "Commune de" ou "Arrondissement de" pour extraire le nom
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i]
        if (part.includes('Commune de')) {
          return part.replace('Commune de', '').trim()
        }
        if (part.includes('Arrondissement de') || part.includes('Arrondissement des')) {
          return part.replace(/Arrondissement (de|des) /, '').trim()
        }
      }
      // Sinon, prendre le dernier élément (généralement la ville)
      const lastPart = parts[parts.length - 1]
      return lastPart.split(' ')[0] // Prendre le premier mot
    }
    
    return ''
  }

  const getDeliveryZone = (): string => {
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const addressData = JSON.parse(savedAddress)
        // Si une zone est déjà définie, l'utiliser
        if (addressData.zone) {
          return addressData.zone
        }
        // Sinon, extraire la zone depuis l'adresse complète
        const fullAddress = addressData.fullAddress || ''
        if (fullAddress) {
          return extractZoneFromAddress(fullAddress)
        }
        // Si on a la ville, l'utiliser
        if (addressData.city) {
          return addressData.city
        }
      } catch (e) {
        // En cas d'erreur, retourner vide
      }
    }
    // Si aucune adresse n'est trouvée, retourner une chaîne vide
    return ''
      }

  const formatDatetimeLocal = (iso: string | null): string => {
    if (!iso) return ''
    const date = new Date(iso)
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  const formatReservationDisplay = (value: string) => {
    if (!value) return 'Non défini'
    const date = new Date(value)
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
    const day = date.getDate()
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long' })
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    // Capitaliser la première lettre du jour et du mois
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1)
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    return `${capitalizedDayName} ${day} ${capitalizedMonthName} ${year} à ${hours}:${minutes}`
  }

  const getReservationDetails = () => {
    const saved = localStorage.getItem('faata_reservationDetails')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        return {
          guestCount: typeof data.guestCount === 'number' ? data.guestCount : 2,
          scheduledDateTime: data.scheduledDateTime || null,
        }
      } catch (error) {
        return { guestCount: 2, scheduledDateTime: null }
      }
    }
    return { guestCount: 2, scheduledDateTime: null }
  }

  const [fullName, setFullName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [address, setAddress] = useState(getDeliveryAddress())
  const [deliveryZone, setDeliveryZone] = useState(getDeliveryZone())
  const [tableNumber, setTableNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const reservationDefaults = getReservationDetails()
  const [reservationGuests, setReservationGuests] = useState(reservationDefaults.guestCount || 2)
  const [reservationDateTime, setReservationDateTime] = useState(formatDatetimeLocal(reservationDefaults.scheduledDateTime || null))
  const [orderNote, setOrderNote] = useState('')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')

  // Calculer les frais de livraison (exemple : 2000 FCFA pour ASCENA)
  const deliveryFee = orderType === 'livraison' ? 2000 : 0
  const subtotal = getTotal()
  const total = subtotal + deliveryFee

  // Fonction pour détecter la position et mettre à jour l'adresse (utilisée via LocationModal)
  // const handleDetectLocation = async () => {
  //   setDetectingLocation(true)
  //   setError(null)
  //   try {
  //     const addressData = await getCurrentLocation()
  //     setAddress(addressData.fullAddress || '')
  //     setDeliveryZone(addressData.zone || 'BARGNY')
  //     localStorage.setItem('faata_deliveryAddress', JSON.stringify(addressData))
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Erreur lors de la détection de la position')
  //   } finally {
  //     setDetectingLocation(false)
  //   }
  // }

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (items.length === 0) {
        setError('Votre panier est vide')
        setLoading(false)
        return
      }

      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price, // Inclure le prix avec extras
        name: item.name, // Inclure le nom avec extras
      }))

      const orderData: any = {
        items: orderItems,
        orderType: orderType,
        customerInfo: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
      }

      // Si sur place uniquement, ajouter le numéro de table
      if (orderType === 'sur_place') {
        if (!tableNumber.trim()) {
          setError('Veuillez indiquer le numéro de table')
          setLoading(false)
          return
        }
        orderData.tableNumber = tableNumber.trim()
      }

      // Si livraison, ajouter l'adresse de livraison
      if (orderType === 'livraison') {
        if (!address.trim()) {
          setError('Veuillez indiquer une adresse de livraison')
          setLoading(false)
          return
        }
        const savedAddress = localStorage.getItem('faata_deliveryAddress')
        if (savedAddress) {
          try {
            const addressData = JSON.parse(savedAddress)
            orderData.deliveryAddress = {
              fullAddress: address,
              street: addressData.street,
              city: addressData.city,
              zipCode: addressData.zipCode,
              coordinates: addressData.coordinates,
              zone: deliveryZone,
            }
          } catch (e) {
            orderData.deliveryAddress = {
              fullAddress: address,
              zone: deliveryZone,
            }
          }
        } else {
          orderData.deliveryAddress = {
            fullAddress: address,
            zone: deliveryZone,
          }
        }
      }

      // Ajouter la note de commande
      if (orderNote.trim()) {
        orderData.note = orderNote.trim()
      }

      if (orderType === 'reservation') {
        if (!reservationDateTime) {
          setError('Veuillez sélectionner une date et une heure de réservation')
          setLoading(false)
          return
        }
        orderData.reservationDetails = {
          guestCount: reservationGuests,
          scheduledDateTime: new Date(reservationDateTime).toISOString(),
        }
      }

      const order = await ordersAPI.create(orderData)

      console.log('Order created:', order) // Debug log

      const orderId = (order?._id || order?.id)?.toString()
      console.log('Order ID extracted:', orderId) // Debug log

      if (orderId && order) {
        useModalStore.getState().setSelectedOrder(orderId)
        
        // Stocker l'ID de commande dans sessionStorage
        sessionStorage.setItem('faata_lastOrderId', orderId)
        
        // Stocker les données complètes de la commande retournées par l'API
        // Utiliser directement l'objet order qui contient toutes les données formatées
        sessionStorage.setItem('faata_lastOrderData', JSON.stringify(order))
        
        console.log('Order data stored in sessionStorage') // Debug log

        localStorage.removeItem('faata_deliveryAddress')
        localStorage.removeItem('faata_orderType')

        clearCart()
        
        // Rediriger immédiatement vers la page de remerciement
        console.log('Navigating to:', `/thank-you/${orderId}`) // Debug log
        navigate(`/thank-you/${orderId}`, { replace: true })
      } else {
        console.error('No orderId found in response:', order) // Debug log
        setError('Erreur: Impossible de récupérer l\'ID de commande')
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour la zone quand l'adresse sauvegardée change
  useEffect(() => {
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const addressData = JSON.parse(savedAddress)
        if (addressData.fullAddress) {
          const extractedZone = extractZoneFromAddress(addressData.fullAddress)
          if (extractedZone) {
            setDeliveryZone(extractedZone)
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [])

  // Rediriger si le panier est vide
  useEffect(() => {
    if (items.length === 0) {
      navigate('/menu')
    }
  }, [items.length, navigate])

  useEffect(() => {
    if (orderType === 'reservation') {
      const payload = {
        guestCount: reservationGuests,
        scheduledDateTime: reservationDateTime ? new Date(reservationDateTime).toISOString() : null,
      }
      localStorage.setItem('faata_reservationDetails', JSON.stringify(payload))
    }
  }, [orderType, reservationGuests, reservationDateTime])

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Votre panier est vide</p>
          <button
            onClick={() => navigate('/menu')}
            className="px-6 py-3 bg-[#39512a] text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Retour au menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      {/* Header identique à la page Menu */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="flex items-center flex-shrink-0">
                <img src="/images/logo.png" alt="FAATA BEACH" className="h-12 md:h-16 lg:h-20" />
              </button>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Icône profil - Mobile uniquement */}
              <button
                onClick={() => navigate('/login')}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Se connecter"
              >
                <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
              </svg>
            </button>
              {/* Menu hamburger - Mobile uniquement */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-normal transition-all"
                >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
                </svg>
                  Se connecter
              </button>
              <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#39512a] hover:bg-[#2f3d1f] text-white rounded-full text-sm font-normal transition-all"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                  S'inscrire
              </button>
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Formulaire */}
          <div className="lg:col-span-2">
            <h1 className="text-xl font-normal text-[#2f2e2e] mb-6">Finaliser la commande</h1>

            <form onSubmit={handleSubmit} className="space-y-6" id="checkout-form">
              {/* Informations client */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                  />
                </div>
              </div>

              {/* Adresse de livraison */}
              {orderType === 'livraison' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-normal text-[#2f2e2e] mb-3">Adresse de livraison</h3>
                    {deliveryZone && (
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium text-[#2f2e2e]">{deliveryZone}</span>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className="text-sm text-[#39512a] hover:underline"
                      >
                        Changer de zone
                      </button>
                    </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onBlur={(e) => {
                          // Mettre à jour la zone quand l'utilisateur termine de saisir
                          const newAddress = e.target.value
                          if (newAddress) {
                            const extractedZone = extractZoneFromAddress(newAddress)
                            if (extractedZone) {
                              setDeliveryZone(extractedZone)
                            }
                          }
                        }}
                        required
                        placeholder="Votre adresse complète"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Numéro de table pour sur place uniquement */}
              {orderType === 'sur_place' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de table <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    required
                    placeholder="Ex: Table 5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                  />
                </div>
              )}

              {orderType === 'reservation' && (
                <div className="space-y-4">
                  <h3 className="text-base font-normal text-[#2f2e2e]">Informations de réservation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de convives <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={reservationGuests}
                        onChange={(e) => setReservationGuests(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date & heure <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={reservationDateTime}
                        onChange={(e) => setReservationDateTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mode de paiement */}
              <div>
                <h3 className="text-base font-normal text-[#2f2e2e] mb-3">Mode de paiement</h3>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <svg className={`w-6 h-6 ${paymentMethod === 'cash' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-normal text-[#2f2e2e]">Espèces à la livraison</div>
                      <div className="text-sm text-gray-600">Paiement en espèces lors de la réception de votre commande</div>
                    </div>
                  </div>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Colonne droite - Résumé */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-normal text-[#2f2e2e]">Résumé de la commande</h2>
                <button
                  onClick={() => navigate('/menu')}
                  className="text-sm text-[#39512a] hover:underline"
                >
                  Modifier
                </button>
              </div>

              {orderType === 'reservation' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm text-[#2f2e2e] space-y-1">
                  <div className="font-medium">Réservation pour {reservationGuests} personne{reservationGuests > 1 ? 's' : ''}</div>
                  <div>Créneau : {formatReservationDisplay(reservationDateTime)}</div>
                </div>
              )}

              {/* Détails des articles */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="relative flex items-center gap-3 pb-3 border-b border-gray-200">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition-colors z-10"
                      aria-label="Supprimer l'article"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 pr-6">
                      <h4 className="text-sm font-medium text-[#2f2e2e]">{item.name}</h4>
                      <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-normal text-[#2f2e2e]">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total ({items.length} article{items.length > 1 ? 's' : ''}):</span>
                  <span className="font-normal text-[#2f2e2e]">{subtotal.toLocaleString('fr-FR')} F CFA</span>
                </div>
                {orderType === 'livraison' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison ({deliveryZone}):</span>
                    <span className="font-normal text-[#2f2e2e]">{deliveryFee.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-normal pt-2 border-t border-gray-200">
                  <span>Total estimé:</span>
                  <span>{total.toLocaleString('fr-FR')} F CFA</span>
                </div>
              </div>

              {/* Note pour la commande */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note pour la commande
                </label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  rows={3}
                  placeholder="Instructions spéciales, allergies, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] resize-none"
                />
              </div>

              {/* Bouton Confirmer */}
              <button
                type="submit"
                form="checkout-form"
                disabled={loading || items.length === 0}
                className="w-full bg-[#39512a] hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-normal py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Traitement...' : (
                  <>
                    Confirmer la commande
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={() => {
          setShowLocationModal(false)
          const savedAddress = localStorage.getItem('faata_deliveryAddress')
          if (savedAddress) {
            try {
              const addressData = JSON.parse(savedAddress)
              setAddress(addressData.fullAddress || '')
              // Extraire la zone depuis l'adresse
              const extractedZone = getDeliveryZone()
              setDeliveryZone(extractedZone)
            } catch (e) {
              // Ignore
            }
          }
        }}
      />

      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />

      {/* Menu mobile modal */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#39512a]">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                  aria-label="Fermer le menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Menu items */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Accueil</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/menu')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Menu</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/gallery')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Galerie</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/about')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>À propos</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/location')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                    </svg>
                    <span>Nous trouver</span>
                  </button>

                  {/* Sélecteur de langue */}
                  <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Langue</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setLanguage('fr')
                            setShowMobileMenu(false)
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            language === 'fr'
                              ? 'bg-[#39512a] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-xl">🇫🇷</span>
                          <span>Français</span>
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('en')
                            setShowMobileMenu(false)
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            language === 'en'
                              ? 'bg-[#39512a] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-xl">🇬🇧</span>
                          <span>English</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </nav>

                <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/login')
                    }}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-all mb-2 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
                    </svg>
                    Se connecter
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/register')
                    }}
                    className="w-full px-4 py-3 bg-[#39512a] hover:opacity-90 text-white rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    S'inscrire
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

