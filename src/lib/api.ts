/// <reference types="../vite-env.d.ts" />
const API_URL = import.meta.env.VITE_API_URL || '/api'

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('faata_token')

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const url = `${API_URL}${endpoint}`
    console.log(`[API] Fetching: ${url}`)
    
    const response = await fetch(url, config)

    console.log(`[API] Response status: ${response.status} for ${endpoint}`)

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`
      try {
        const error = await response.json()
        errorMessage = error.message || errorMessage
        console.error(`[API] Error response:`, error)
      } catch {
        const text = await response.text().catch(() => '')
        console.error(`[API] Error text:`, text)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log(`[API] Success for ${endpoint}:`, data?.length || 'data received')
    return data
  } catch (error) {
    // Erreur réseau ou autre
    console.error(`[API] Network/Fetch error for ${endpoint}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erreur de connexion au serveur')
  }
}

// API Auth - routes consolidées dans api/auth/[action].ts
export const authAPI = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => fetchAPI('/auth/profile'),

  updateProfile: (data: { name?: string; email?: string; phone?: string; address?: any }) =>
    fetchAPI('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchAPI('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

// API Categories - route consolidée dans api/categories.ts
export const categoriesAPI = {
  getAll: () => fetchAPI('/categories'),
  getById: (id: string) => fetchAPI(`/categories?id=${id}`),
}

// API Products - route consolidée dans api/products.ts
export const productsAPI = {
  getAll: (categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : ''
    return fetchAPI(`/products${query}`)
  },
  getById: (id: string) => fetchAPI(`/products?id=${id}`),
}

// API Users - routes consolidées dans api/users/[action].ts
export const usersAPI = {
  getAll: () => fetchAPI('/users/all'),
  getDeliveryUsers: () => fetchAPI('/users/delivery'),
}

// API Orders
export const ordersAPI = {
  create: (data: {
    items: Array<{ productId: string; quantity: number }>
    tableNumber?: string
    orderType: 'sur_place' | 'emporter' | 'livraison'
    deliveryAddress?: {
      fullAddress: string
      street?: string
      city?: string
      zipCode?: string
      coordinates?: {
        lat: number
        lng: number
      }
    }
    customerInfo?: { name?: string; phone?: string; email?: string }
  }) =>
    fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => fetchAPI('/orders'),
  getById: (id: string) => fetchAPI(`/orders/${id}`),
  updateStatus: (id: string, status: string, assignedDeliveryId?: string) =>
    fetchAPI(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, assignedDeliveryId }),
    }),
}

// API Reservations
export const reservationsAPI = {
  create: (data: {
    customerInfo: { name: string; phone: string; email?: string }
    date: string
    time: string
    numberOfGuests: number
    notes?: string
  }) =>
    fetchAPI('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => fetchAPI('/reservations'),
  getById: (id: string) => fetchAPI(`/reservations?id=${id}`),
  update: (id: string, status: string) =>
    fetchAPI(`/reservations?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  cancel: (id: string) =>
    fetchAPI(`/reservations?id=${id}`, {
      method: 'DELETE',
    }),
}

// API Delivery
export const deliveryAPI = {
  getAssignedOrders: () => fetchAPI('/orders/delivery/assigned'),
  updateOrderStatus: (orderId: string, status: string) =>
    fetchAPI(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}

