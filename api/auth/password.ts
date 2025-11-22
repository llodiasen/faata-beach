import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'
import { hashPassword } from '../lib/bcrypt.js'

// Cache pour bcryptjs (même logique que login.ts)
let bcryptCache: any = null

async function getBcrypt() {
  if (bcryptCache) {
    return bcryptCache
  }

  try {
    // Sur Vercel, utiliser uniquement l'import ES modules (plus fiable)
    const bcryptjsModule = await import('bcryptjs')
    
    // bcryptjs peut être exporté de différentes manières
    let bcrypt = bcryptjsModule.default || bcryptjsModule
    
    // Si default n'existe pas ou n'est pas un objet avec compare, utiliser le module directement
    if (!bcrypt || typeof bcrypt !== 'object' || typeof bcrypt.compare !== 'function') {
      bcrypt = bcryptjsModule
    }
    
    // Vérifier que compare existe
    if (!bcrypt || typeof bcrypt.compare !== 'function') {
      throw new Error(`bcrypt.compare is not a function. Module keys: ${Object.keys(bcryptjsModule).join(', ')}`)
    }
    
    bcryptCache = bcrypt
    return bcrypt
  } catch (error: any) {
    console.error('[password] Failed to load bcryptjs:', error.message)
    throw new Error(`Failed to load bcryptjs: ${error.message}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    }

    // Vérifier le mot de passe actuel
    const bcrypt = await getBcrypt()
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' })
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hashPassword(newPassword, 10)
    user.password = hashedNewPassword
    await user.save()

    res.status(200).json({ message: 'Mot de passe modifié avec succès' })
  } catch (error: any) {
    console.error('Change password error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

