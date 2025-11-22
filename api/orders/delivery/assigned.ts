import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../../lib/mongodb.js'
import { Order } from '../../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()
    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé' })
    }

    const payload = verifyToken(token)
    const { userId } = payload
    let role = payload.role
    
    // Si le rôle n'est pas dans le token, vérifier en base
    if (!role) {
      const { User } = await import('../../lib/models.js')
      const user = await User.findById(userId)
      if (!user) {
        return res.status(403).json({ message: 'Utilisateur non trouvé' })
      }
      role = user.role
    }
    
    // Vérifier que l'utilisateur est un livreur
    if (role !== 'delivery') {
      return res.status(403).json({ message: 'Accès refusé - Rôle livreur requis' })
    }

    // Récupérer les commandes assignées à ce livreur avec statuts assign ou on_the_way
    const orders = await Order.find({
      assignedDeliveryId: userId,
      status: { $in: ['assigned', 'on_the_way'] },
    })
      .populate('items.productId', 'name imageUrl')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json(orders)
  } catch (error: any) {
    console.error('Get assigned orders error:', error)
    if (error.message === 'Token invalide') {
      return res.status(401).json({ message: 'Token invalide' })
    }
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

