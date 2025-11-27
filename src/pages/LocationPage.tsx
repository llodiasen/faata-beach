import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BottomNavigation from '../components/layout/BottomNavigation'

// Import des icônes Leaflet (nécessaire pour éviter les erreurs d'icônes manquantes)
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'

// Configuration des icônes par défaut
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Types pour leaflet-routing-machine
declare global {
  interface Window {
    L: typeof L & {
      Routing?: any
    }
  }
}

export default function LocationPage() {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routingControlRef = useRef<any>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')

  // Coordonnées du restaurant
  const restaurantCoords: [number, number] = [14.168013, -16.830818]

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialiser la carte
    const map = L.map(mapContainerRef.current, {
      center: restaurantCoords,
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    // Ajouter le tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Créer un marqueur personnalisé pour le restaurant
    const restaurantIcon = L.divIcon({
      className: 'custom-restaurant-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background-color: rgb(57, 81, 42);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    })

    const restaurantMarker = L.marker(restaurantCoords, { icon: restaurantIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: rgb(57, 81, 42); font-size: 14px;">Notre Restaurant</strong><br/>
          <span style="font-size: 12px; color: #666;">Itinéraire disponible</span>
        </div>
      `)

    // Charger leaflet-routing-machine depuis CDN
    const loadRoutingMachine = () => {
      return new Promise<void>((resolve) => {
        if (window.L?.Routing) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js'
        script.onload = () => {
          // Attendre un peu pour que le script soit complètement chargé
          setTimeout(() => resolve(), 100)
        }
        script.onerror = () => {
          console.error('Erreur lors du chargement de Leaflet Routing Machine')
          resolve() // Continuer même si le routing ne charge pas
        }
        document.head.appendChild(script)
      })
    }

    // Demander la géolocalisation
    const requestUserLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('La géolocalisation n\'est pas supportée par votre navigateur')
        setIsLoading(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ]


          // Créer un marqueur pour l'utilisateur
          const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: `
              <div style="
                width: 32px;
                height: 32px;
                background-color: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  background-color: white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          })

          userMarkerRef.current = L.marker(userCoords, { icon: userIcon })
            .addTo(map)
            .bindPopup('Votre position')

          // Ajuster la vue pour voir les deux marqueurs
          const group = new L.FeatureGroup([restaurantMarker, userMarkerRef.current])
          map.fitBounds(group.getBounds().pad(0.1))

          // Charger et initialiser le routing
          loadRoutingMachine().then(() => {
            if (window.L?.Routing) {
              const Routing = window.L.Routing

              // Créer l'itinéraire
              routingControlRef.current = Routing.control({
                waypoints: [
                  L.latLng(userCoords[0], userCoords[1]),
                  L.latLng(restaurantCoords[0], restaurantCoords[1]),
                ],
                routeWhileDragging: false,
                showAlternatives: false,
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: false,
                show: false, // Masquer le panneau de directions
                lineOptions: {
                  styles: [
                    {
                      color: 'rgb(57, 81, 42)',
                      opacity: 0.8,
                      weight: 5,
                    },
                  ],
                },
                createMarker: () => null, // Ne pas créer de marqueurs supplémentaires
              })

              routingControlRef.current.addTo(map)

              // Masquer le panneau de directions
              setTimeout(() => {
                const container = routingControlRef.current?.getContainer()
                if (container) {
                  const panel = container.querySelector('.leaflet-routing-container')
                  if (panel) {
                    ;(panel as HTMLElement).style.display = 'none'
                  }
                }
              }, 100)
            }
          })

          setIsLoading(false)
        },
        (error) => {
          console.error('Erreur géolocalisation:', error)
          setLocationError('Impossible d\'obtenir votre position')
          setIsLoading(false)
          // Ajuster la vue sur le restaurant uniquement
          map.setView(restaurantCoords, 15)
        }
      )
    }

    requestUserLocation()

    // Nettoyage
    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current)
        } catch (e) {
          console.error('Erreur lors de la suppression du routing control:', e)
        }
      }
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current)
      }
      map.remove()
    }
  }, [])

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurantCoords[0]},${restaurantCoords[1]}`

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Menu hamburger - Mobile uniquement */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button onClick={() => navigate('/')} className="flex items-center flex-shrink-0">
                <img src="/images/logo.png" alt="FAATA BEACH" className="h-12 md:h-16 lg:h-20" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              {/* Boutons login/register - Desktop uniquement */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-full border border-[#121212] hover:bg-[#121212] hover:text-white transition-colors text-sm font-medium"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 rounded-full bg-[#121212] text-white hover:bg-black transition-colors text-sm font-medium"
                >
                  S'inscrire
                </button>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Retour"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-8 pb-3">
          <h1 className="text-xl md:text-2xl font-bold text-[#39512a]">Trouver le restaurant</h1>
        </div>
      </header>

      {/* Carte */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#39512a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#39512a] font-medium">Chargement de la carte...</p>
            </div>
          </div>
        )}
        {locationError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm z-40 shadow-lg">
            {locationError}
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full rounded-t-2xl overflow-hidden" />
      </div>

      {/* Bouton Google Maps */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 z-20">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-[90%] max-w-md mx-auto block bg-[rgb(57,81,42)] text-white py-4 px-6 rounded-full font-semibold text-center shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ouvrir dans Google Maps
        </a>
      </div>

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

                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/login')
                    }}
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
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
                    className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>S'inscrire</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />

      {/* Styles CSS pour les marqueurs personnalisés */}
      <style>{`
        .custom-restaurant-marker,
        .custom-user-marker {
          background: transparent !important;
          border: none !important;
        }

        .leaflet-routing-container {
          display: none !important;
        }

        .leaflet-routing-alt {
          display: none !important;
        }

        .leaflet-control-container {
          z-index: 10;
        }

        .leaflet-routing-geocoders {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
