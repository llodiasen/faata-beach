import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FavoriteItem {
  productId: string
  name: string
  price: number
  imageUrl?: string
  description?: string
  restaurant?: string
}

interface FavoritesStore {
  items: FavoriteItem[]
  addFavorite: (item: FavoriteItem) => void
  removeFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
  toggleFavorite: (item: FavoriteItem) => void
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      addFavorite: (item) => {
        const existingItem = get().items.find((i) => i.productId === item.productId)
        if (!existingItem) {
          set({ items: [...get().items, item] })
        }
      },
      removeFavorite: (productId: string) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },
      isFavorite: (productId: string) => {
        return get().items.some((i) => i.productId === productId)
      },
      toggleFavorite: (item) => {
        const isFavorite = get().isFavorite(item.productId)
        if (isFavorite) {
          get().removeFavorite(item.productId)
        } else {
          get().addFavorite(item)
        }
      },
    }),
    {
      name: 'faata-favorites-storage',
    }
  )
)

