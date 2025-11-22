import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé, token manquant' })
    }

    const payload = verifyToken(token)
    // Seul l'admin peut voir la liste des livreurs
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé, rôle non autorisé' })
    }

    // Récupérer tous les utilisateurs avec le rôle 'delivery'
    const deliveryUsers = await User.find({ role: 'delivery' }).select('name phone email')
      .sort({ name: 1 })

    console.log(`[delivery-users] Found ${deliveryUsers.length} delivery users`)
    
    const formattedUsers = deliveryUsers.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      phone: user.phone || '',
      email: user.email,
    }))

    console.log(`[delivery-users] Formatted users:`, formattedUsers)
    
    res.status(200).json(formattedUsers)
  } catch (error: any) {
    console.error('Get delivery users error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}
