import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/layout/BottomNavigation'

export default function GalleryPage() {
  const navigate = useNavigate()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6 text-[#39512a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
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

      {/* Contenu */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#39512a] mb-6">Galerie</h1>
        
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-600 text-lg">Les photos seront bientôt disponibles</p>
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
                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all" aria-label="Fermer le menu">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1">
                  <button onClick={() => { setShowMobileMenu(false); navigate('/') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span>Accueil</span>
                  </button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/menu') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <span>Menu</span>
                  </button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/gallery') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Galerie</span>
                  </button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/about') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>À propos</span>
                  </button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/location') }} className="w-full px-4 py-3 text-left text-[#39512a] hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414m0 0a5 5 0 10-7.07 7.07 5 5 0 007.07-7.07z" /></svg>
                    <span>Nous trouver</span>
                  </button>
                </nav>
                <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                  <button onClick={() => { setShowMobileMenu(false); navigate('/login') }} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-all mb-2 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" strokeWidth={2} stroke="currentColor" fill="none" /></svg>
                    Se connecter
                  </button>
                  <button onClick={() => { setShowMobileMenu(false); navigate('/register') }} className="w-full px-4 py-3 bg-[#39512a] hover:opacity-90 text-white rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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

