import { create } from 'zustand'

export type ModalType =
  | 'categories'
  | 'products'
  | 'productDetail'
  | 'cart'
  | 'checkout'
  | 'confirmation'
  | 'login'
  | 'signup'
  | 'orderTracking'
  | 'reservation'
  | 'orderDetails'
  | 'assignDelivery'
  | 'deliveryTracking'
  | null

interface ModalStore {
  currentModal: ModalType
  openModal: (modal: ModalType) => void
  closeModal: () => void
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
  selectedProduct: string | null
  setSelectedProduct: (productId: string | null) => void
  selectedOrder: string | null
  setSelectedOrder: (orderId: string | null) => void
}

export const useModalStore = create<ModalStore>((set) => ({
  currentModal: null,
  openModal: (modal) => set({ currentModal: modal }),
  closeModal: () => set({ currentModal: null }),
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  selectedProduct: null,
  setSelectedProduct: (productId) => set({ selectedProduct: productId }),
  selectedOrder: null,
  setSelectedOrder: (orderId) => set({ selectedOrder: orderId }),
}))

