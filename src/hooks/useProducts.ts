import { useState, useEffect } from 'react'
import { productsAPI } from '../lib/api'

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  categoryId: {
    _id: string
    name: string
  }
}

export const useProducts = (categoryId?: string) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await productsAPI.getAll(categoryId)
        setProducts(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categoryId])

  return { products, loading, error }
}

