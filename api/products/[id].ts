import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb'
import { Product } from '../lib/models'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID de produit requis' })
    }

    const product = await Product.findById(id).populate('categoryId', 'name')

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' })
    }

    res.status(200).json(product)
  } catch (error: any) {
    console.error('Product error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

