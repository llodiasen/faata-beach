import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb'
import { Category } from '../lib/models'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID de catégorie requis' })
    }

    const category = await Category.findById(id)

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' })
    }

    res.status(200).json(category)
  } catch (error: any) {
    console.error('Category error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

