import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore } from '../../store/useCartStore'

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getItemCount } = useCartStore()

  const cartCount = getItemCount()

  const navItems = [
    {
      id: 'home',
      label: 'Accueil',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
      path: '/',
      onClick: () => navigate('/'),
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      ),
      path: '/orders',
      onClick: () => {
        // TODO: Navigate to orders page or open orders modal
        navigate('/profile?tab=orders')
      },
    },
    {
      id: 'favorites',
      label: 'Favoris',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      activeIcon: (
        <div className="relative">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ),
      path: '/favourites',
      onClick: () => navigate('/favourites'),
      badge: undefined, // Pas de badge pour favoris pour l'instant
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      path: '/profile',
      onClick: () => navigate('/profile'),
    },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Afficher uniquement sur mobile
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-1 relative transition-colors ${
                active ? 'text-orange-500' : 'text-gray-500'
              }`}
              aria-label={item.label}
            >
              {/* Badge pour le panier sur l'icône home */}
              {item.id === 'home' && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
              
              {/* Indicateur actif pour favoris */}
              {item.id === 'favorites' && active && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full -z-10 opacity-20" />
              )}
              
              <div className={active ? 'text-orange-500' : 'text-gray-500'}>
                {active ? item.activeIcon : item.icon}
              </div>
              
              {/* Indicateur actif */}
              {active && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-orange-500 rounded-b-full" />
              )}
              
              <span className={`text-xs font-medium ${active ? 'text-orange-500' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

