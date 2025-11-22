import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { User } from '../lib/models.js'
import { generateToken } from '../lib/auth.js'

// Cache pour bcryptjs (chargé de manière lazy)
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
      // Essayer avec le module lui-même
      bcrypt = bcryptjsModule
    }
    
    // Vérifier que compare existe
    if (!bcrypt || typeof bcrypt.compare !== 'function') {
      throw new Error(`bcrypt.compare is not a function. Module keys: ${Object.keys(bcryptjsModule).join(', ')}`)
    }
    
    bcryptCache = bcrypt
    return bcrypt
  } catch (error: any) {
    console.error('[bcrypt] Failed to load bcryptjs:', error.message)
    console.error('[bcrypt] Error stack:', error.stack)
    throw new Error(`Failed to load bcryptjs: ${error.message}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // FORCER L'AFFICHAGE - TEST SI LE CODE S'EXECUTE
  console.error('🔴🔴🔴 LOGIN HANDLER CALLED 🔴🔴🔴')
  console.error('Method:', req.method)
  console.error('Body:', JSON.stringify(req.body))
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  console.log('[login] 🔐 Login attempt received')
  console.error('[login] 🔐 Login attempt received (via console.error)')

  try {
    await connectDB()
    console.log('[login] ✅ MongoDB connected')

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' })
    }

    console.log('[login] 🔍 Searching for user with email:', email)
    const user = await User.findOne({ email })
    if (!user) {
      console.log('[login] ❌ User not found:', email)
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }

    console.log('[login] ✅ User found:', user.email)
    
    // Charger bcrypt de manière lazy
    console.log('[login] 🔒 Loading bcrypt for password comparison...')
    const bcrypt = await getBcrypt()
    
    // Vérifier que bcrypt est bien chargé
    if (!bcrypt || typeof bcrypt.compare !== 'function') {
      console.error('[login] ❌ bcrypt.compare is not available!')
      console.error('[login] bcrypt type:', typeof bcrypt)
      console.error('[login] bcrypt keys:', bcrypt ? Object.keys(bcrypt) : 'bcrypt is null/undefined')
      throw new Error('bcrypt.compare is not a function')
    }
    
    // Comparer les mots de passe directement
    console.log('[login] 🔒 About to compare password for user:', user.email)
    let isMatch: boolean
    try {
      isMatch = await bcrypt.compare(password, user.password)
      console.log('[login] ✅ Password comparison result:', isMatch)
    } catch (error: any) {
      console.error('[login] ❌ Error during password comparison:', error.message)
      console.error('[login] Error stack:', error.stack)
      throw error
    }
    
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
}

