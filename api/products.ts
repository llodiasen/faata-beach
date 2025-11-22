import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from './lib/mongodb.js'
import { Product } from './lib/models.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const id = req.query.id as string
    const { categoryId } = req.query

    // Si un ID est fourni, retourner le produit spécifique
    if (id && typeof id === 'string') {
      const product = await Product.findById(id).populate('categoryId', 'name')
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' })
      }
      return res.status(200).json(product)
    }

    // Sinon, retourner tous les produits (optionnellement filtrés par catégorie)
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

