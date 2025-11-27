import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalStore } from '../store/useModalStore'
import { useCartStore } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'
import { getUserRole } from '../lib/permissions'
import { useGeolocation } from '../hooks/useGeolocation'
import { DeliveryTimePicker } from '../components/ui/DeliveryTimePicker'
import { ScheduleTimeModal } from '../components/modals/ScheduleTimeModal'
import BottomNavigation from '../components/layout/BottomNavigation'
import { CategoriesModal } from '../components/modals/CategoriesModal'
import { ProductsModal } from '../components/modals/ProductsModal'
import { ProductDetailModal } from '../components/modals/ProductDetailModal'
import { CartModal } from '../components/modals/CartModal'
import { CheckoutModal } from '../components/modals/CheckoutModal'
import { ConfirmationModal } from '../components/modals/ConfirmationModal'
import { OrderTrackingModal } from '../components/modals/OrderTrackingModal'
import { MenuModal } from '../components/modals/MenuModal'
import { LoginModal } from '../components/auth/LoginModal'
import { SignupModal } from '../components/auth/SignupModal'

export default function Home() {
  const navigate = useNavigate()
  const { currentModal, openModal } = useModalStore()
  const { getItemCount } = useCartStore()
  const { user, logout } = useAuthStore()
  const userRole = getUserRole(user)
  const { getCurrentLocation, loading: geolocationLoading } = useGeolocation()
  const [orderType, setOrderType] = useState<'sur_place' | 'reservation' | 'livraison'>('sur_place')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryScheduledDateTime, setDeliveryScheduledDateTime] = useState<Date | null>(null)
  const [reservationGuests, setReservationGuests] = useState<number>(0)
  const [reservationDateTime, setReservationDateTime] = useState<Date | null>(null)
  const [requestingLocation, setRequestingLocation] = useState(false)
  const hasRequestedLocation = useRef(false)
  const [scheduleMode, setScheduleMode] = useState<'livraison' | 'reservation'>('livraison')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const [hasClickedScheduleLivraison, setHasClickedScheduleLivraison] = useState(false)

  const heroBackground = 'http://wasafrica.org/wp-content/uploads/2025/11/96444e8b6107fad5-scaled.webp'

  // Désactiver le scroll sur le body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedReservation = localStorage.getItem('faata_reservationDetails')
    if (savedReservation) {
      try {
        const data = JSON.parse(savedReservation)
        // Ne charger le nombre de personnes que s'il existe vraiment (pas de valeur par défaut)
        if (typeof data.guestCount === 'number' && data.guestCount > 0) {
          setReservationGuests(data.guestCount)
        }
        if (data.scheduledDateTime) {
          setReservationDateTime(new Date(data.scheduledDateTime))
        }
      } catch (error) {
        // ignore parse errors
      }
    }
  }, [])

  // Handler pour changer le type de commande
  const handleOrderTypeChange = (type: 'sur_place' | 'reservation' | 'livraison') => {
    setOrderType(type)
    localStorage.setItem('faata_orderType', type)
    // Réinitialiser les états de créneau
    setHasClickedScheduleLivraison(false)

    // Sur place : rediriger vers le menu
    if (type === 'sur_place') {
      navigate('/menu', { state: { orderType: 'sur_place' } })
      return
    }

    // Pour livraison : afficher les filtres de localisation
    if (type === 'livraison') {
      // Laisser la géolocalisation gérer l'adresse
      // Ne pas rediriger, les filtres s'afficheront automatiquement
      return
    }

    // Pour réservation : réinitialiser la localisation et afficher les filtres de créneaux
    hasRequestedLocation.current = false
    setDeliveryAddress('')
    // Ne pas rediriger, les filtres s'afficheront automatiquement
  }

  // Demander la géolocalisation quand "Livraison" est sélectionné
  useEffect(() => {
    if (orderType === 'livraison' && !deliveryAddress && !requestingLocation && !geolocationLoading && !hasRequestedLocation.current) {
      hasRequestedLocation.current = true
      setRequestingLocation(true)
      getCurrentLocation()
        .then((address) => {
          setDeliveryAddress(address.fullAddress)
          // Sauvegarder l'adresse dans localStorage
          localStorage.setItem('faata_deliveryAddress', JSON.stringify({
            ...address,
            scheduledDateTime: deliveryScheduledDateTime ? deliveryScheduledDateTime.toISOString() : null
          }))
          setRequestingLocation(false)
        })
        .catch((error) => {
          console.error('Erreur géolocalisation:', error)
          setRequestingLocation(false)
          hasRequestedLocation.current = false // Permettre de réessayer
          // L'utilisateur peut toujours saisir manuellement l'adresse
        })
    }
  }, [orderType, deliveryAddress, requestingLocation, geolocationLoading, deliveryScheduledDateTime, getCurrentLocation])

  const handleSearch = () => {
    // Validation pour livraison
    if (orderType === 'livraison') {
      if (!deliveryAddress.trim()) {
        alert('Veuillez saisir une adresse de livraison')
        return
      }
      if (hasClickedScheduleLivraison && !deliveryScheduledDateTime) {
        alert('Veuillez sélectionner un créneau pour la livraison')
        return
      }
    }

    // Validation pour réservation
    if (orderType === 'reservation') {
      if (!reservationGuests || reservationGuests < 1) {
        alert('Veuillez saisir le nombre de personnes')
        return
      }
      if (!reservationDateTime) {
        alert('Veuillez sélectionner un créneau pour la réservation')
        return
      }
    }

    // Sauvegarder le type de commande dans localStorage
    localStorage.setItem('faata_orderType', orderType)
    
    // Si livraison, sauvegarder l'adresse
    if (orderType === 'livraison' && deliveryAddress.trim()) {
      const addressData = {
        fullAddress: deliveryAddress.trim(),
        scheduledDateTime: deliveryScheduledDateTime ? deliveryScheduledDateTime.toISOString() : null
      }
      localStorage.setItem('faata_deliveryAddress', JSON.stringify(addressData))
    }

    if (orderType === 'reservation') {
      // Ne sauvegarder que si le nombre de personnes est défini
      if (reservationGuests && reservationGuests > 0) {
        const reservationData = {
          guestCount: reservationGuests,
          scheduledDateTime: reservationDateTime ? reservationDateTime.toISOString() : null
        }
        localStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
        sessionStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
      }
    }
    
    navigate('/menu', { state: { orderType, address: deliveryAddress, scheduledDateTime: deliveryScheduledDateTime, reservationDetails: orderType === 'reservation' && reservationGuests && reservationGuests > 0 ? {
      guestCount: reservationGuests,
      scheduledDateTime: reservationDateTime ? reservationDateTime.toISOString() : null
    } : undefined } })
  }

  return (
    <div className="h-screen relative flex flex-col overflow-hidden">
      {/* Hero section inspirée Uber Eats */}
      <section className="relative h-screen md:h-full w-full overflow-hidden text-white md:text-[#121212] flex flex-col">
        {/* Image de fond */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={heroBackground}
            alt="Délicieux burgers et frites"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ 
              objectFit: 'cover', 
              objectPosition: 'center',
              width: '100%',
              height: '100%'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/40 to-transparent md:from-white md:via-white/85 md:to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Navigation - Logo à gauche, Hamburger à droite */}
          <nav className="flex items-center justify-between px-4 md:px-10 py-3 md:py-4 relative z-20">
            <button onClick={() => navigate('/')} className="flex items-center flex-shrink-0">
              <img src="/images/logo.png" alt="FAATA BEACH" className="h-16 md:h-16 lg:h-20" />
            </button>
            <div className="flex items-center gap-2 md:gap-4">
              {user ? (
                <>
                  {/* Icône profil - Desktop et Mobile */}
                  <button
                    onClick={() => {
                      if (userRole === 'admin') {
                        navigate('/dashboard-admin')
                      } else if (userRole === 'delivery') {
                        navigate('/dashboard-livreur')
                      } else {
                        navigate('/profile')
                      }
                    }}
                    className="p-2 hover:bg-white/20 md:hover:bg-white/80 rounded-full transition-all flex items-center gap-2"
                    aria-label="Mon profil"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#39512a] flex items-center justify-center text-white font-bold text-sm md:text-base shadow-md">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {/* Texte sur desktop */}
                    <span className="hidden md:block text-[#39512a] font-medium text-sm px-2">
                      Hello, <span className="font-semibold">{user.name}</span>
                    </span>
                  </button>
                </>
              ) : (
                <>
                  {/* Icône profil - Mobile uniquement */}
                  <button
                    onClick={() => navigate('/login')}
                    className="md:hidden p-2 hover:bg-white/20 rounded-full transition-all"
                    aria-label="Se connecter"
                  >
                    <svg className="w-7 h-7 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" />
                    </svg>
                  </button>
                  <div className="hidden md:flex items-center gap-5">
                    <button
                      onClick={() => navigate('/login')}
                      className="px-3 py-2 rounded-full border border-[#39512a] hover:bg-[#39512a] hover:text-white transition-colors text-sm"
                    >
                      Se connecter
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="px-3 py-2 rounded-full bg-[#39512a] text-white hover:opacity-90 transition-colors text-sm"
                    >
                      S'inscrire
                    </button>
                  </div>
                </>
              )}
              {/* Menu hamburger - Mobile et Desktop */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 hover:bg-white/20 md:hover:bg-white/80 rounded-full transition-all"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-8 h-8 md:w-6 md:h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </nav>

          {/* Contenu principal - Style Uber Eats */}
          <div className="flex-1 flex flex-col justify-center px-4 md:px-10 pb-4 md:pb-0 overflow-hidden">
            <div className="max-w-3xl w-full space-y-4 md:space-y-6">
              {/* Titre principal */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#39512a] leading-tight mb-4 md:mb-6">
                Commander en quelques clics
              </h1>
              
              {/* Sélecteur de mode de commande - Mobile: empilés verticalement, Desktop: horizontal */}
              <div className="mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row gap-2 md:gap-3 md:bg-white/90 md:rounded-full md:p-1 md:shadow-lg w-full md:w-auto">
                  <button
                    onClick={() => handleOrderTypeChange('sur_place')}
                    className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-full text-sm md:text-base font-medium transition-all whitespace-nowrap w-full md:w-auto ${
                      orderType === 'sur_place'
                        ? 'bg-[#39512a] text-white'
                        : 'bg-white/90 text-[#121212] hover:bg-white shadow-lg md:shadow-none md:bg-transparent md:hover:bg-gray-100'
                    }`}
                  >
                    Sur place
                  </button>
                  <button
                    onClick={() => handleOrderTypeChange('reservation')}
                    className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-full text-sm md:text-base font-medium transition-all whitespace-nowrap w-full md:w-auto ${
                      orderType === 'reservation'
                        ? 'bg-[#39512a] text-white'
                        : 'bg-white/90 text-[#121212] hover:bg-white shadow-lg md:shadow-none md:bg-transparent md:hover:bg-gray-100'
                    }`}
                  >
                    Réservation table
                  </button>
                  <button
                    onClick={() => handleOrderTypeChange('livraison')}
                    className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-full text-sm md:text-base font-medium transition-all whitespace-nowrap w-full md:w-auto ${
                      orderType === 'livraison'
                        ? 'bg-[#39512a] text-white'
                        : 'bg-white/90 text-[#121212] hover:bg-white shadow-lg md:shadow-none md:bg-transparent md:hover:bg-gray-100'
                    }`}
                  >
                    Livraison
                  </button>
                </div>
              </div>

              {/* Champs de saisie - Style Uber Eats (champs blancs avec coins arrondis) */}
              {orderType === 'livraison' && (
                <div className="space-y-3">
                  {/* Champ d'adresse */}
                  <div className="bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
                    {geolocationLoading || requestingLocation ? (
                      <svg className="w-5 h-5 text-[#121212] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-[#121212] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                      </svg>
                    )}
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder={geolocationLoading || requestingLocation ? "Récupération de votre position..." : "Saisir l'adresse de livraison"}
                      disabled={geolocationLoading || requestingLocation}
                      className="flex-1 bg-transparent focus:outline-none text-base text-[#121212] placeholder:text-gray-400 disabled:opacity-50"
                    />
                  </div>
                  
                  {/* Sélecteur de date/heure */}
                  <div className="bg-white rounded-lg shadow-lg px-4 py-3">
                    <DeliveryTimePicker
                      value={deliveryScheduledDateTime}
                      onChange={(date) => {
                        setDeliveryScheduledDateTime(date)
                        if (date) {
                          setHasClickedScheduleLivraison(false)
                        }
                      }}
                      onScheduleClick={() => {
                        setHasClickedScheduleLivraison(true)
                        setScheduleMode('livraison')
                        openModal('scheduleTime')
                      }}
                    />
                  </div>
                  {hasClickedScheduleLivraison && !deliveryScheduledDateTime && (
                    <p className="text-xs text-red-500 mt-1">Veuillez sélectionner un créneau</p>
                  )}
                  
                  {/* Bouton Rechercher - Style Uber Eats */}
                  <button
                    onClick={handleSearch}
                    className="w-full bg-[#39512a] text-white rounded-lg px-3 py-2 font-semibold text-sm hover:opacity-90 transition-colors shadow-lg"
                  >
                    Rechercher
                  </button>
                  
                  {/* Lien "Ou Se connecter" */}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-white text-sm font-medium hover:underline"
                  >
                    Ou Se connecter
                  </button>
                </div>
              )}

              {/* Formulaire réservation - Style Uber Eats */}
              {orderType === 'reservation' && (
                <div className="space-y-3">
                  {/* Champ nombre de convives */}
                  <div className="bg-white rounded-lg shadow-lg px-4 py-3">
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
                        // Ne pas mettre de valeur par défaut, laisser vide si l'utilisateur n'a rien saisi
                        if (!e.target.value || parseInt(e.target.value) < 1) {
                          setReservationGuests(0)
                        }
                      }}
                      className="w-full bg-transparent focus:outline-none text-base text-[#121212] placeholder:text-gray-400"
                      placeholder="Nombre de personnes"
                    />
                  </div>

                  {/* Sélecteur de date/heure */}
                  <div className="bg-white rounded-lg shadow-lg px-4 py-3">
                    <DeliveryTimePicker
                      value={reservationDateTime}
                      onChange={setReservationDateTime}
                      onNowClick={() => {
                        const now = new Date()
                        setReservationDateTime(now)
                        // Ne sauvegarder que si le nombre de personnes est défini
                        if (reservationGuests && reservationGuests > 0) {
                          const reservationData = {
                            guestCount: reservationGuests,
                            scheduledDateTime: now.toISOString()
                          }
                          localStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
                          sessionStorage.setItem('faata_reservationDetails', JSON.stringify(reservationData))
                          localStorage.setItem('faata_orderType', 'reservation')
                          navigate('/menu', { 
                            state: { 
                              orderType: 'reservation',
                              reservationDetails: reservationData
                            } 
                          })
                        } else {
                          alert('Veuillez saisir le nombre de personnes')
                        }
                        return
                      }}
                      onScheduleClick={() => {
                        setScheduleMode('reservation')
                        openModal('scheduleTime')
                      }}
                    />
                  </div>

                  {/* Bouton Réserver - Style Uber Eats */}
                  <button
                    onClick={handleSearch}
                    className="w-full bg-[#39512a] text-white rounded-lg px-3 py-2 font-semibold text-sm hover:opacity-90 transition-colors shadow-lg"
                  >
                    Réserver
                  </button>
                  
                  {/* Lien "Ou Se connecter" */}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-white text-sm font-medium hover:underline"
                  >
                    Ou Se connecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bouton panier flottant - Desktop uniquement */}
      {getItemCount() > 0 && (
        <button
          onClick={() => openModal('cart')}
          className="hidden md:flex fixed bottom-6 right-6 bg-[#39512a] text-white px-4 py-2 rounded-full shadow-lg items-center gap-1.5 z-40 hover:opacity-90 transition-colors text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Panier</span>
          <span className="bg-white text-[#39512a] rounded-full px-1.5 py-0.5 text-xs font-bold">
            {getItemCount()}
          </span>
        </button>
      )}

      {/* Menu modal - Mobile et Desktop */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#121212]">Menu</h2>
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
                    className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
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
                    className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
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
                    className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
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
                    className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
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
                    className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.414 12.414l-3.172-3.172a5 5 0 00-7.07 7.07l3.172 3.172m0 0l3.172 3.172m-3.172-3.172L6.343 6.343" />
                    </svg>
                    <span>Nous trouver</span>
                  </button>

                  {/* Switcher de langue */}
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 py-2">
                    <p className="text-xs font-medium text-gray-500 mb-2">Langue</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setLanguage('fr')
                          setShowMobileMenu(false)
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                          language === 'fr'
                            ? 'border-[#39512a] bg-[#39512a]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">🇫🇷</span>
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('en')
                          setShowMobileMenu(false)
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                          language === 'en'
                            ? 'border-[#39512a] bg-[#39512a]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">🇬🇧</span>
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>

                  {user ? (
                    <>
                      {userRole === 'admin' || userRole === 'delivery' || userRole === 'customer' ? (
                        <button
                          onClick={() => {
                            setShowMobileMenu(false)
                            if (userRole === 'admin') {
                              navigate('/dashboard-admin')
                            } else if (userRole === 'delivery') {
                              navigate('/dashboard-livreur')
                            } else {
                              navigate('/profile')
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>
                            {userRole === 'admin' ? 'Dashboard Admin' : userRole === 'delivery' ? 'Dashboard Livreur' : 'Mon Profil'}
                          </span>
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          navigate('/profile')
                        }}
                        className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Mon Profil</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          logout()
                          navigate('/')
                        }}
                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Déconnexion</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          navigate('/login')
                        }}
                        className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Se connecter</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowMobileMenu(false)
                          navigate('/register')
                        }}
                        className="w-full px-4 py-3 text-left text-[#121212] hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>S'inscrire</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {currentModal === 'categories' && <CategoriesModal />}
      {currentModal === 'products' && <ProductsModal />}
      {currentModal === 'productDetail' && <ProductDetailModal />}
      {currentModal === 'cart' && <CartModal />}
      {currentModal === 'checkout' && <CheckoutModal />}
      {currentModal === 'confirmation' && <ConfirmationModal />}
      {currentModal === 'orderTracking' && <OrderTrackingModal />}
      {currentModal === 'menu' && <MenuModal />}
      {currentModal === 'login' && <LoginModal />}
      {currentModal === 'signup' && <SignupModal />}
      {currentModal === 'scheduleTime' && (
        <ScheduleTimeModal
          value={scheduleMode === 'livraison' ? deliveryScheduledDateTime : reservationDateTime}
          onChange={(date) => {
            if (scheduleMode === 'livraison') {
              setDeliveryScheduledDateTime(date)
            } else {
              setReservationDateTime(date)
            }
          }}
        />
      )}

      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />
    </div>
  )
}

