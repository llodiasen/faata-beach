import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
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
        role: user.role,
      })
    } catch (error: any) {
      console.error('Profile error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else if (req.method === 'PATCH') {
    // Mettre à jour le profil
    try {
      await connectDB()

      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé, token manquant' })
      }

      const { userId } = verifyToken(token)
      const user = await User.findById(userId)
      
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' })
      }

      const { name, email, phone, address } = req.body

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' })
        }
        user.email = email
      }

      if (name) user.name = name
      if (phone !== undefined) user.phone = phone
      if (address) user.address = address

      await user.save()

      res.status(200).json({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      })
    } catch (error: any) {
      console.error('Update profile error:', error)
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

