import { useModalStore } from '../store/useModalStore'
import { useCartStore } from '../store/useCartStore'
import Header from '../components/layout/Header'
import Hero from '../components/layout/Hero'
import BottomNavigation from '../components/layout/BottomNavigation'
import { CategoriesModal } from '../components/modals/CategoriesModal'
import { ProductsModal } from '../components/modals/ProductsModal'
import { ProductDetailModal } from '../components/modals/ProductDetailModal'
import { CartModal } from '../components/modals/CartModal'
import { CheckoutModal } from '../components/modals/CheckoutModal'
import { ConfirmationModal } from '../components/modals/ConfirmationModal'
import { OrderTrackingModal } from '../components/modals/OrderTrackingModal'
import { LoginModal } from '../components/auth/LoginModal'
import { SignupModal } from '../components/auth/SignupModal'

export default function Home() {
  const { currentModal, openModal } = useModalStore()
  const { getItemCount } = useCartStore()

  return (
    <div className="min-h-screen relative flex flex-col pb-20 md:pb-0">
      {/* Hero avec background image */}
      <Hero />

      {/* Header */}
      <Header />

      {/* Bouton panier flottant */}
      {getItemCount() > 0 && (
        <button
          onClick={() => openModal('cart')}
          className="fixed bottom-24 md:bottom-6 right-6 bg-faata-red text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 z-40 hover:bg-red-700 transition-colors text-xs"
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
          <span className="bg-white text-faata-red rounded-full px-1.5 py-0.5 text-xs font-bold">
            {getItemCount()}
          </span>
        </button>
      )}

      {/* Modales */}
      {currentModal === 'categories' && <CategoriesModal />}
      {currentModal === 'products' && <ProductsModal />}
      {currentModal === 'productDetail' && <ProductDetailModal />}
      {currentModal === 'cart' && <CartModal />}
      {currentModal === 'checkout' && <CheckoutModal />}
      {currentModal === 'confirmation' && <ConfirmationModal />}
      {currentModal === 'orderTracking' && <OrderTrackingModal />}
      {currentModal === 'login' && <LoginModal />}
      {currentModal === 'signup' && <SignupModal />}

      {/* Bottom Navigation - Mobile uniquement */}
      <BottomNavigation />
    </div>
  )
}

