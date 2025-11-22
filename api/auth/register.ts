import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { User } from '../lib/models.js'
import { generateToken } from '../lib/auth.js'
import { hashPassword } from '../lib/bcrypt.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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

    // Utiliser la fonction helper pour hasher le mot de passe
    const hashedPassword = await hashPassword(password, 10)

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
    })

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
}

