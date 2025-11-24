import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity' | 'id'> | Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantityToAdd = 1) => {
        // Générer un ID unique basé sur productId + name + timestamp pour éviter les collisions
        const itemName = item.name || ''
        const uniqueId = `${item.productId}-${itemName.replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        const cartItem = 'id' in item ? item : { ...item, id: uniqueId }
        
        // Comparer par productId ET name pour gérer les variantes (extras/tailles différentes)
        const existingItem = get().items.find(
          (i) => i.productId === cartItem.productId && i.name === cartItem.name && i.price === cartItem.price
        )
        
        if (existingItem) {
          // Si l'item existe déjà (même produit, même nom, même prix), incrémenter la quantité
          set({
            items: get().items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + quantityToAdd }
                : i
            ),
          })
        } else {
          // Sinon, ajouter comme nouvel item avec la quantité spécifiée
          set({
            items: [
              ...get().items,
              {
                ...cartItem,
                quantity: quantityToAdd,
              },
            ],
          })
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
        } else {
          set({
            items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          })
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'faata-cart-storage',
    }
  )
)

