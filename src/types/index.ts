// Types partagés pour l'application

export interface Category {
  _id: string
  name: string
  description?: string
  imageUrl?: string
  displayOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  _id: string
  categoryId: string | {
    _id: string
    name: string
  }
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  displayOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface OrderItem {
  productId: string | {
    _id: string
    name: string
    imageUrl?: string
  }
  quantity: number
  price: number
  name: string
}

export interface Order {
  _id: string
  userId?: string | {
    _id: string
    name: string
    email: string
  }
  tableNumber?: string
  orderType: 'sur_place' | 'emporter'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed'
  items: OrderItem[]
  totalAmount: number
  customerInfo?: {
    name?: string
    phone?: string
    email?: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  address?: {
    street?: string
    city?: string
    zipCode?: string
  }
}

