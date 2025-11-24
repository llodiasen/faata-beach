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
  const { items, getTotal, clearCart, getItemCount } = useCartStore()
  const { user } = useAuthStore()
  const { openModal } = useModalStore()
  // const { getCurrentLocation } = useGeolocation() // Utilisé via LocationModal
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Récupérer le type de commande depuis localStorage
  const getOrderType = (): 'sur_place' | 'emporter' | 'livraison' => {
    const savedOrderType = localStorage.getItem('faata_orderType')
    return (savedOrderType as 'sur_place' | 'emporter' | 'livraison') || 'livraison'
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

  const getDeliveryZone = (): string => {
    const savedAddress = localStorage.getItem('faata_deliveryAddress')
    if (savedAddress) {
      try {
        const address = JSON.parse(savedAddress)
        return address.zone || 'BARGNY'
      } catch (e) {
        return 'BARGNY'
      }
    }
    return 'BARGNY'
  }

  const [fullName, setFullName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [address, setAddress] = useState(getDeliveryAddress())
  const [deliveryZone, setDeliveryZone] = useState(getDeliveryZone())
  const [tableNumber, setTableNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [orderNote, setOrderNote] = useState('')
  const [showLocationModal, setShowLocationModal] = useState(false)

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

      // Si sur place, ajouter le numéro de table
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

      const order = await ordersAPI.create(orderData)

      const orderId = (order._id || order.id)?.toString()
      if (orderId) {
        useModalStore.getState().setSelectedOrder(orderId)
      }

      localStorage.removeItem('faata_deliveryAddress')
      localStorage.removeItem('faata_orderType')

      clearCart()
      navigate('/')
      setTimeout(() => {
        openModal('confirmation')
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  // Rediriger si le panier est vide
  useEffect(() => {
    if (items.length === 0) {
      navigate('/menu')
    }
  }, [items.length, navigate])

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
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Barre supérieure sombre */}
      <div className="bg-[#2f2e2e] text-white py-2 px-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>338750938</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Service de livraison 11H00 - 23h00 7/7</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>contact@kfcsenegal.com</span>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Menu hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/menu')} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={() => navigate('/')} className="flex items-center">
                <img src="/images/logo.png" alt="FAATA BEACH" className="h-8" />
              </button>
            </div>

            {/* Bouton Nos restaurants */}
            <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Nos restaurants
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Barre de recherche */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <input
                type="search"
                placeholder="Rechercher un produit"
                className="w-full px-4 py-2 pl-10 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#39512a]"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Zone de livraison */}
            <div className="hidden xl:flex flex-col items-start">
              <span className="text-xs text-gray-500">Zone de livraison</span>
              <button className="text-sm font-medium text-[#2f2e2e] flex items-center gap-1">
                {deliveryZone}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Icônes utilisateur et panier */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button
                onClick={() => openModal('cart')}
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getItemCount() > 0 && (
                  <span className="absolute top-0 right-0 bg-[#39512a] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        placeholder="Votre adresse complète"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Numéro de table pour sur place */}
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
                  onClick={() => openModal('cart')}
                  className="text-sm text-[#39512a] hover:underline"
                >
                  Modifier
                </button>
              </div>

              {/* Détails des articles */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1">
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
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-normal py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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
              setDeliveryZone(addressData.zone || 'BARGNY')
            } catch (e) {
              // Ignore
            }
          }
        }}
      />

      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />
    </div>
  )
}

