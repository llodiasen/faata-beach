import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useCartStore } from '../../store/useCartStore'
import { useModalStore } from '../../store/useModalStore'
import { useAuthStore } from '../../store/useAuthStore'

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getItemCount } = useCartStore()
  const { closeModal } = useModalStore()
  const { user } = useAuthStore()
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollY = useRef(0)

  const cartCount = getItemCount()

  const { openModal } = useModalStore()

  // Gérer la visibilité du menu basé sur l'interaction utilisateur
  useEffect(() => {
    const showNav = () => {
      setIsVisible(true)
      // Masquer après 3 secondes d'inactivité
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    }

    const handleTouchStart = () => {
      showNav()
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Afficher si l'utilisateur scroll vers le haut ou vers le bas
      if (Math.abs(currentScrollY - lastScrollY.current) > 5) {
        showNav()
        lastScrollY.current = currentScrollY
      }
    }

    const handleMouseMove = () => {
      showNav()
    }

    // Écouter les événements
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Afficher au chargement initial
    showNav()

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleNavigate = (path: string) => {
    // Fermer tous les modals avant de naviguer
    closeModal()
    // Petite pause pour permettre la fermeture des modals
    setTimeout(() => {
      navigate(path)
    }, 100)
  }

  const handleCartClick = () => {
    closeModal()
    setTimeout(() => {
      openModal('cart')
    }, 100)
  }

  const navItems = [
    {
      id: 'home',
      label: 'Accueil',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
      path: '/',
      onClick: () => handleNavigate('/'),
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      path: '/menu',
      onClick: () => handleNavigate('/menu'),
    },
    {
      id: 'favorites',
      label: 'Favoris',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      activeIcon: (
        <div className="relative">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ),
      path: '/favourites',
      onClick: () => handleNavigate('/favourites'),
    },
    {
      id: 'cart',
      label: 'Panier',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      ),
      path: '/cart',
      onClick: handleCartClick,
    },
    {
      id: user ? 'profile' : 'checkout',
      label: user ? 'Profil' : 'Valider commande',
      icon: user ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      activeIcon: user ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: user ? '/profile' : '/checkout',
      onClick: () => {
        if (user) {
          handleNavigate('/profile')
        } else {
          handleNavigate('/checkout')
        }
      },
    },
  ]

  const isActive = (path: string, id: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    if (id === 'cart') {
      // Actif si le modal cart est ouvert
      return false // Le panier n'est pas une route mais un modal
    }
    return location.pathname.startsWith(path)
  }

  // Afficher uniquement sur mobile
  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-[60] md:hidden shadow-lg transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="grid grid-cols-5 h-12">
        {navItems.map((item) => {
          const active = isActive(item.path, item.id)
          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                item.onClick()
                setIsVisible(true) // Afficher quand on clique
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
                timeoutRef.current = setTimeout(() => {
                  setIsVisible(false)
                }, 3000)
              }}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors touch-manipulation ${
                active ? 'text-orange-500' : 'text-gray-500'
              } active:bg-gray-100`}
              aria-label={item.label}
              type="button"
            >
              {/* Badge pour le panier sur l'icône cart */}
              {item.id === 'cart' && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
              
              <div className={`${active ? 'text-orange-500' : 'text-gray-500'} w-5 h-5`}>
                {active ? item.activeIcon : item.icon}
              </div>
              
              {/* Indicateur actif */}
              {active && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-orange-500 rounded-full" />
              )}
              
              <span className={`text-[10px] font-medium leading-tight ${active ? 'text-orange-500' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

