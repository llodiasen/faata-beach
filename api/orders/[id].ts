import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Order } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID de commande requis' })
    }

    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé' })
    }

    const { userId } = verifyToken(token)

    const order = await Order.findById(id)
      .populate('items.productId', 'name imageUrl')
      .populate('userId', 'name email')

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' })
    }

    // Vérifier que l'utilisateur est propriétaire de la commande
    if (order.userId && order.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    res.status(200).json(order)
  } catch (error: any) {
    console.error('Get order error:', error)
    if (error.message === 'Token invalide') {
      return res.status(401).json({ message: 'Token invalide' })
    }
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

