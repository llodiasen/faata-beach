import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { User, Order } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

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
    let role = payload.role
    
    // Si le rôle n'est pas dans le token, vérifier en base
    if (!role) {
      const user = await User.findById(payload.userId)
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' })
      }
      role = user.role
    }

    // Seul l'admin peut voir tous les clients
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    // Récupérer tous les clients (role='customer')
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 })

    // Récupérer les statistiques de commandes pour chaque client
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ userId: customer._id })
        
        const totalOrders = orders.length
        const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0)

        return {
          id: customer._id.toString(),
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          totalOrders,
          totalAmount,
          createdAt: customer.createdAt,
        }
      })
    )

    res.status(200).json(customersWithStats)
  } catch (error: any) {
    console.error('Get users error:', error)
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}

