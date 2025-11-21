import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb'
import { User } from '../lib/models'
import { getTokenFromRequest, verifyToken } from '../lib/auth'

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

    const { userId } = verifyToken(token)

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    })
  } catch (error: any) {
    console.error('Profile error:', error)
    if (error.message === 'Token invalide') {
      return res.status(401).json({ message: 'Token invalide' })
    }
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

