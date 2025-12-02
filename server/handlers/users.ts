import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { User, Order } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extraire l'action depuis req.query.action ou depuis l'URL
  let action = req.query.action as string
  
  // Si action n'est pas dans query, essayer de l'extraire de l'URL
  if (!action && req.url) {
    const match = req.url.match(/\/users\/([^/?]+)/)
    if (match) {
      action = match[1]
    }
  }

  await connectDB()

  const token = getTokenFromRequest(req)
  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, token manquant' })
  }

  const payload = verifyToken(token)
  if (payload.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé, rôle non autorisé' })
  }

  // GET ALL CUSTOMERS
  if ((!action || action === 'all') && req.method === 'GET') {
    try {
      const customers = await User.find({ role: 'customer' }).select('-password')
      
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const customerOrders = await Order.find({ userId: customer._id })
          const totalOrders = customerOrders.length
          const totalOrderAmount = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0)

          return {
            id: customer._id.toString(),
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            emailSubscription: true,
            totalOrders,
            totalOrderAmount,
            createdAt: customer.createdAt,
          }
        })
      )

      res.status(200).json(customersWithStats)
    } catch (error: any) {
      console.error('Get customers error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
    return
  }

  // GET DELIVERY USERS
  if (action === 'delivery' && req.method === 'GET') {
    try {
      const deliveryUsers = await User.find({ role: 'delivery' }).select('name phone email').sort({ name: 1 })

      res.status(200).json(deliveryUsers.map(user => ({
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone || '',
        email: user.email,
      })))
    } catch (error: any) {
      console.error('Get delivery users error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
    return
  }

  res.status(404).json({ message: 'Action non trouvée' })
}

