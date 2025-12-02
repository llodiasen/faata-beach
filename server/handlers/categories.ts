import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Category } from '../lib/models.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({ 
        message: 'Configuration error: MONGODB_URI is missing'
      })
    }

    await connectDB()

    // Vérifier si on a un id dans le query
    const id = req.query.id as string

    // Si un ID est fourni, retourner la catégorie spécifique
    if (id && typeof id === 'string') {
      const category = await Category.findById(id)
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' })
      }
      return res.status(200).json(category)
    }

    // Sinon, retourner toutes les catégories actives
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 })
    res.status(200).json(categories)
  } catch (error: any) {
    console.error('Categories error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

