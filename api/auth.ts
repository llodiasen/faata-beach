import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from './lib/mongodb.js'
import { User } from './lib/models.js'
import { generateToken, getTokenFromRequest, verifyToken } from './lib/auth.js'
import { hashPassword } from './lib/bcrypt.js'

// Import direct de bcryptjs pour Vercel
import bcryptjs from 'bcryptjs'

// Vérifier que bcryptjs est correctement chargé
const getBcrypt = () => {
  if (!bcryptjs || typeof bcryptjs.compare !== 'function') {
    throw new Error(`bcrypt.compare is not a function. Type: ${typeof bcryptjs}, Keys: ${bcryptjs ? Object.keys(bcryptjs).join(', ') : 'null'}`)
  }
  return bcryptjs
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extraire l'action depuis req.query.action (pour les query params)
  const action = req.query.action as string

  if (!action) {
    return res.status(400).json({ message: 'Paramètre action requis' })
  }

  // LOGIN
  if (action === 'login' && req.method === 'POST') {
    try {
      await connectDB()
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' })
      }

      const user = await User.findOne({ email })
      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
      }

      const bcrypt = getBcrypt()
      const isMatch = await bcrypt.compare(password, user.password)
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
      }

      const token = generateToken(user._id.toString(), user.role)

      res.status(200).json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      })
    } catch (error: any) {
      console.error('Login error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
    return
  }

  // REGISTER
  if (action === 'register' && req.method === 'POST') {
    try {
      await connectDB()
      const { name, email, password, phone } = req.body

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nom, email et mot de passe requis' })
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' })
      }

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' })
      }

      const hashedPassword = await hashPassword(password, 10)
      const user = new User({ name, email, password: hashedPassword, phone })
      await user.save()

      const token = generateToken(user._id.toString(), user.role)

      res.status(201).json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      })
    } catch (error: any) {
      console.error('Register error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
    return
  }

  // PROFILE (GET et PATCH)
  if (action === 'profile') {
    await connectDB()
    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé, token manquant' })
    }

    try {
      const { userId } = verifyToken(token)

      if (req.method === 'GET') {
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
      } else if (req.method === 'PATCH') {
        const user = await User.findById(userId)
        if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' })
        }

        const { name, email, phone, address } = req.body

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
      } else {
        res.status(405).json({ message: 'Method not allowed' })
      }
    } catch (error: any) {
      console.error('Profile error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
    return
  }

  // PASSWORD
  if (action === 'password' && req.method === 'PATCH') {
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

      const bcrypt = getBcrypt()
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' })
      }

      const hashedNewPassword = await hashPassword(newPassword, 10)
      user.password = hashedNewPassword
      await user.save()

      res.status(200).json({ message: 'Mot de passe modifié avec succès' })
    } catch (error: any) {
      console.error('Change password error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
    return
  }

  res.status(404).json({ message: 'Action non trouvée' })
}

