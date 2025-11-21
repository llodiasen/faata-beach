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

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
    throw new Error(error.message || 'Une erreur est survenue')
  }

  return response.json()
}

// API Auth
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
}

// API Categories
export const categoriesAPI = {
  getAll: () => fetchAPI('/categories'),
  getById: (id: string) => fetchAPI(`/categories/${id}`),
}

// API Products
export const productsAPI = {
  getAll: (categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : ''
    return fetchAPI(`/products${query}`)
  },
  getById: (id: string) => fetchAPI(`/products/${id}`),
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
}

