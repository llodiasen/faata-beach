import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb'
import { Product } from '../lib/models'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { categoryId } = req.query

    const query: any = { isAvailable: true }

    if (categoryId && typeof categoryId === 'string') {
      query.categoryId = categoryId
    }

    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ displayOrder: 1 })

    res.status(200).json(products)
  } catch (error: any) {
    console.error('Products error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

