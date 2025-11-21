import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb'
import { Category } from '../lib/models'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 })

    res.status(200).json(categories)
  } catch (error: any) {
    console.error('Categories error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

