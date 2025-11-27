import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsAPI } from '../lib/api'
import { getProductImage } from '../lib/productImages'
import BottomNavigation from '../components/layout/BottomNavigation'

interface Product {
  _id: string
  name: string
  price: number
  imageUrl?: string
  description?: string
}

export default function AboutPage() {
  const navigate = useNavigate()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const heroBackground = 'http://wasafrica.org/wp-content/uploads/2025/11/96444e8b6107fad5-scaled.webp'

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const allProducts = await productsAPI.getAll()
        // Prendre les 3 premiers produits comme "Best Menus"
        setPopularProducts(allProducts.slice(0, 3))
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPopularProducts()
  }, [])

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center flex-shrink-0">
              <img src="/images/logo.png" alt="FAATA BEACH" className="h-12 md:h-16 lg:h-20" />
            </button>
            <div className="flex items-center gap-2">
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
              {/* Bouton retour - Desktop uniquement */}
              <button
                onClick={() => navigate(-1)}
                className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Retour"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="w-full">
        {/* Image Hero du restaurant */}
        <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
          <img
            src={heroBackground}
            alt="FAATA BEACH"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/images/logo.png'
            }}
          />
          {/* Points de carousel */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div
                key={dot}
                className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </div>

        {/* Informations du restaurant */}
        <div className="px-4 md:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Nom du restaurant */}
            <h1 className="text-3xl md:text-4xl font-bold text-[#121212] mb-3">FAATA BEACH</h1>

            {/* Note et avis */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z" />
                </svg>
                <span className="text-lg font-semibold text-[#121212]">5.0</span>
              </div>
              <span className="text-sm text-gray-600">1,240 avis</span>
            </div>

            {/* Localisation */}
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.414 12.414l-3.172-3.172a5 5 0 00-7.07 7.07l3.172 3.172m0 0l3.172 3.172m-3.172-3.172L6.343 6.343" />
              </svg>
              <span className="text-base text-gray-700">Plage de Bargny, Sénégal</span>
            </div>

            {/* Tag */}
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-[#39512a] text-white text-sm font-medium rounded-full">
                Fruits de mer
              </span>
            </div>

            {/* Description */}
            <div className="mb-8">
              <p className="text-base text-gray-700 leading-relaxed">
                FAATA BEACH est un restaurant de plage qui allie saveurs authentiques et ambiance décontractée. 
                Fondé avec la passion de partager les meilleurs produits de la mer et les spécialités locales, 
                nous vous accueillons dans un cadre chaleureux face à l'océan. Notre approche du menu est simple : 
                nous proposons des choix populaires avec un style authentique, des portions généreuses de fruits de mer, 
                de plats locaux et une touche de créativité. Nous vous garantissons une expérience culinaire exceptionnelle 
                avec des ingrédients frais et de qualité. Et n'oubliez pas - gardez de la place pour le dessert !
              </p>
            </div>

            {/* Section Location */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#121212] mb-4">Localisation</h2>
              <div className="w-full h-[200px] md:h-[300px] rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.5!2d-16.830818!3d14.168013!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDEwJzA0LjkiTiAxNsKwNDknNTAuOSJX!5e0!3m2!1sfr!2ssn!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation FAATA BEACH"
                />
              </div>
            </div>

            {/* Section Best Menus */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#121212] mb-4">Meilleurs plats</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39512a]"></div>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {popularProducts.map((product) => {
                    const imageUrl = getProductImage(product)
                    return (
                      <div
                        key={product._id}
                        className="flex-shrink-0 w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        <div className="relative h-[180px] bg-gray-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🍽️
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-[#121212] mb-2">{product.name}</h3>
                          <div className="flex items-center gap-1 mb-2">
                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z" />
                            </svg>
                            <span className="text-sm font-medium text-[#121212]">
                              {4.5 + Math.random() * 0.5}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({Math.floor(Math.random() * 200 + 100)} avis)
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Réserver maintenant - Fixe en bas sur mobile */}
      <div className="fixed bottom-16 md:static md:bottom-auto left-0 right-0 md:px-8 pb-4 md:pb-8 z-20 bg-white md:bg-transparent border-t md:border-t-0 border-gray-200 md:border-0">
        <div className="max-w-4xl mx-auto px-4 md:px-0">
          <button
            onClick={() => navigate('/menu')}
            className="w-full md:w-auto px-6 py-4 bg-[#39512a] hover:opacity-90 text-white font-semibold rounded-lg transition-all text-base md:text-lg"
          >
            Réserver maintenant
          </button>
        </div>
      </div>

      <BottomNavigation />

      {/* Menu mobile modal */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#39512a]">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1">
                  <button onClick={() => { setShowMobileMenu(false); navigate('/') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span>Accueil</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/menu') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span>Menu</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/gallery') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>Galerie</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/about') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>À propos</span></button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/location') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" /></svg><span>Nous trouver</span></button>
                </nav>
                <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                  <button onClick={() => { setShowMobileMenu(false); navigate('/login') }} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-all mb-2 flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" /></svg>Se connecter</button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/register') }} className="w-full px-4 py-3 bg-[#39512a] hover:opacity-90 text-white rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>S'inscrire</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
