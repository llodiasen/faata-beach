import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb'
import { User } from '../lib/models'
import { generateToken } from '../lib/auth'
import bcrypt from 'bcryptjs'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }

    const token = generateToken(user._id.toString())

    res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

