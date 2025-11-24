import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { getUserRole } from '../../lib/permissions'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const userRole = getUserRole(user)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/dashboard-admin'
    if (userRole === 'delivery') return '/dashboard-livreur'
    if (userRole === 'customer') return '/profile'
    return null
  }

  const getDashboardLabel = () => {
    if (userRole === 'admin') return 'Dashboard Admin'
    if (userRole === 'delivery') return 'Dashboard Livreur'
    if (userRole === 'customer') return 'Mon Profil'
    return null
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="hover:opacity-80 transition-opacity"
        >
          <img src="/images/logo.png" alt="FAATA BEACH" className="h-12 md:h-16" />
        </button>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white text-sm">Bonjour, {user.name}</span>
              {getDashboardLink() && (
                <button
                  onClick={() => navigate(getDashboardLink()!)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  {getDashboardLabel()}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors text-xs"
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-faata-red hover:opacity-90 text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-bold"
              >
                S'inscrire
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

