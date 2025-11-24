import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LocationModal } from '../modals/LocationModal'
import { useModalStore } from '../../store/useModalStore'
import { categoriesAPI } from '../../lib/api'

interface Category {
  _id: string
  name: string
  description?: string
  imageUrl?: string
}

export default function Hero() {
  const navigate = useNavigate()
  const { setSelectedCategory } = useModalStore()
  const [orderType, setOrderType] = useState<'sur_place' | 'emporter' | 'livraison'>('sur_place')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Image du Hero
  const heroImage = '/images/Hero/HERO.png'

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const data = await categoriesAPI.getAll()
        // Limiter à 6 catégories pour l'affichage
        setCategories(data.slice(0, 6))
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    // Naviguer vers la page menu avec la catégorie sélectionnée
    navigate('/menu', { state: { categoryId } })
  }

  const handleCommander = () => {
    // Si livraison, demander la géolocalisation d'abord
    if (orderType === 'livraison') {
      setShowLocationModal(true)
      return
    }
    
    // Pour sur_place et emporter, naviguer vers la page Menu
    localStorage.setItem('faata_orderType', orderType)
    navigate('/menu')
  }


  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fond de fallback (visible si l'image ne charge pas) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#39512a] via-[#2f2e2e] to-black" />
      
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
          <img src="/images/logo.png" alt="FAATA BEACH" className="h-24 md:h-32 lg:h-40 mx-auto mb-3 drop-shadow-md" />
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
                    ? 'bg-[#39512a] text-white shadow-sm'
                    : 'bg-gray-50 text-[#2f2e2e] hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Sur place
              </button>
              <button
                onClick={() => setOrderType('emporter')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                  orderType === 'emporter'
                    ? 'bg-[#39512a] text-white shadow-sm'
                    : 'bg-gray-50 text-[#2f2e2e] hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Emporter
              </button>
              <button
                onClick={() => setOrderType('livraison')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                  orderType === 'livraison'
                    ? 'bg-[#39512a] text-white shadow-sm'
                    : 'bg-gray-50 text-[#2f2e2e] hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Livraison
              </button>
            </div>
          </div>

          {/* Bouton Commander - Design épuré */}
          <button
            onClick={handleCommander}
            className="w-full bg-[#39512a] hover:opacity-90 active:opacity-80 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-xs tracking-wide shadow-md hover:shadow-lg"
          >
            Commander
          </button>
        </div>
      </div>

      {/* Section Catégories - Desktop uniquement, sur toute la largeur */}
      {!loadingCategories && categories.length > 0 && (
        <div className="hidden md:block relative z-10 w-full py-6 px-6 -mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className="flex flex-col items-center gap-2 group hover:scale-105 transition-transform duration-200"
                >
                  <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center p-2 group-hover:shadow-xl transition-all border-2 border-white/20">
                    {category.imageUrl ? (
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.category-fallback')) {
                              const fallback = document.createElement('div')
                              fallback.className = 'category-fallback w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center rounded-full'
                              fallback.innerHTML = '<span class="text-4xl">🍽️</span>'
                              parent.appendChild(fallback)
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#39512a]/10 to-[#2f2e2e]/10 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                  </div>
                  <span className="text-white text-base font-semibold whitespace-nowrap drop-shadow-lg">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

