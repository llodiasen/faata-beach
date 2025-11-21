import { useModalStore } from '../../store/useModalStore'
import { useAuthStore } from '../../store/useAuthStore'

export default function Header() {
  const { openModal } = useModalStore()
  const { user, logout } = useAuthStore()

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-white font-bold text-2xl">FAATA BEACH</div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white text-sm">Bonjour, {user.name}</span>
              <button
                onClick={logout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openModal('login')}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Se connecter
              </button>
              <button
                onClick={() => openModal('signup')}
                className="bg-faata-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold"
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

