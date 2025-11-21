import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Category } from '../lib/models.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Vérifier les variables d'environnement
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined')
      return res.status(500).json({ 
        message: 'Configuration error: MONGODB_URI is missing',
        error: 'MONGODB_URI environment variable is not set'
      })
    }

    console.log('Connecting to MongoDB...')
    await connectDB()
    console.log('MongoDB connected successfully')

    console.log('Fetching categories...')
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 })
    console.log(`Found ${categories.length} categories`)

    res.status(200).json(categories)
  } catch (error: any) {
    console.error('Categories error:', error)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    })
    
    // Messages d'erreur plus spécifiques
    let errorMessage = 'Erreur serveur'
    if (error.message?.includes('MONGODB_URI')) {
      errorMessage = 'Erreur de configuration: MONGODB_URI manquante'
    } else if (error.message?.includes('connection') || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Erreur de connexion à MongoDB. Vérifiez Network Access et les variables d\'environnement.'
    } else if (error.message) {
      errorMessage = error.message
    }

    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

