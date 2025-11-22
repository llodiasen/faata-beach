import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalStore } from '../../store/useModalStore'
import { LocationModal } from '../modals/LocationModal'

export default function Hero() {
  const navigate = useNavigate()
  const { openModal } = useModalStore()
  const [orderType, setOrderType] = useState<'sur_place' | 'emporter' | 'livraison'>('sur_place')
  const [tableNumber, setTableNumber] = useState('')
  const [showLocationModal, setShowLocationModal] = useState(false)

  // Image du Hero
  const heroImage = '/images/Hero/HERO.png'

  const handleCommander = () => {
    // Si livraison, demander la géolocalisation d'abord
    if (orderType === 'livraison') {
      setShowLocationModal(true)
      return
    }
    
    // Pour sur_place et emporter, naviguer vers la page Menu
    localStorage.setItem('faata_orderType', orderType)
    if (tableNumber) {
      localStorage.setItem('faata_tableNumber', tableNumber)
    }
    navigate('/menu')
  }


  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fond de fallback (visible si l'image ne charge pas) */}
      <div className="absolute inset-0 bg-gradient-to-br from-faata-red via-red-800 to-black" />
      
      {/* Image de fond Hero */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Contenu central */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-10 md:mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-3 tracking-tight drop-shadow-md">
            FAATA BEACH
          </h1>
          <p className="text-base md:text-lg text-white/85 font-light tracking-wide drop-shadow-sm">
            Découvrez nos saveurs authentiques
          </p>
        </div>

        {/* Carte blanche avec sélecteur - Design minimaliste */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8 max-w-md w-full border border-white/20">
          {/* Section Mode de commande */}
          <div className="mb-6">
            <label className="block text-gray-800 font-medium mb-3 text-left text-sm tracking-wide">
              Mode de commande
            </label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setOrderType('sur_place')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                  orderType === 'sur_place'
                    ? 'bg-faata-red text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Sur place
              </button>
              <button
                onClick={() => setOrderType('emporter')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                  orderType === 'emporter'
                    ? 'bg-faata-red text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Emporter
              </button>
              <button
                onClick={() => setOrderType('livraison')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                  orderType === 'livraison'
                    ? 'bg-faata-red text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Livraison
              </button>
            </div>
            
            {/* Input Numéro de table */}
            {orderType === 'sur_place' && (
              <div className="animate-fadeInUp">
                <label className="block text-gray-800 font-medium mb-2.5 text-left text-sm tracking-wide">
                  Numéro de table
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: Table 5"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-faata-red/30 focus:border-faata-red text-sm transition-all bg-white text-gray-800 placeholder:text-gray-400"
                />
              </div>
            )}
          </div>

          {/* Bouton Commander - Design épuré */}
          <button
            onClick={handleCommander}
            className="w-full bg-faata-red hover:bg-red-600 active:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-xs tracking-wide shadow-md hover:shadow-lg"
          >
            Commander
          </button>
        </div>
      </div>

      {/* Modal de géolocalisation */}
      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={() => {
          setShowLocationModal(false)
          navigate('/menu')
        }}
      />
    </div>
  )
}

