import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Order, Product } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Créer une commande
    try {
      await connectDB()

      const { items, tableNumber, orderType, deliveryAddress, customerInfo } = req.body

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items requis' })
      }

      if (!orderType || !['sur_place', 'emporter', 'livraison'].includes(orderType)) {
        return res.status(400).json({ message: 'Type de commande invalide' })
      }

      // Vérifier que l'adresse de livraison est fournie pour les commandes en livraison
      if (orderType === 'livraison' && !deliveryAddress) {
        return res.status(400).json({ message: 'Adresse de livraison requise' })
      }

      // Vérifier les produits et calculer le total
      let totalAmount = 0
      const orderItems: any[] = []

      for (const item of items) {
        const product = await Product.findById(item.productId)
        if (!product || !product.isAvailable) {
          return res.status(400).json({
            message: `Produit ${item.productId} non disponible`,
          })
        }

        const itemTotal = product.price * item.quantity
        totalAmount += itemTotal

        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: product.price,
          name: product.name,
        })
      }

      // Récupérer userId si token présent
      let userId = null
      const token = getTokenFromRequest(req)
      if (token) {
        try {
          const { userId: tokenUserId } = verifyToken(token)
          userId = tokenUserId
        } catch (error) {
          // Token invalide, on continue sans userId (commande invité)
        }
      }

      const order = new Order({
        userId: userId || null,
        tableNumber: orderType === 'sur_place' ? tableNumber : undefined,
        orderType,
        deliveryAddress: orderType === 'livraison' ? deliveryAddress : undefined,
        items: orderItems,
        totalAmount,
        customerInfo: customerInfo || {},
      })

      await order.save()
      await order.populate('items.productId', 'name imageUrl')

      res.status(201).json(order)
    } catch (error: any) {
      console.error('Create order error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else if (req.method === 'GET') {
    // Obtenir les commandes (nécessite auth)
    try {
      await connectDB()

      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const payload = verifyToken(token)
      const { userId } = payload
      let role = payload.role
      
      // Si le rôle n'est pas dans le token, vérifier en base
      if (!role) {
        const { User } = await import('../lib/models.js')
        const user = await User.findById(userId)
        if (!user) {
          return res.status(401).json({ message: 'Utilisateur non trouvé' })
        }
        role = user.role
      }

      // Filtrer selon le rôle
      let query: any = {}
      if (role === 'admin') {
        // Admin voit toutes les commandes
        query = {}
      } else if (role === 'delivery') {
        // Livreur voit seulement les commandes qui lui sont assignées
        query = { assignedDeliveryId: userId }
      } else {
        // Client voit seulement ses commandes
        query = { userId }
      }

      const orders = await Order.find(query)
        .populate('items.productId', 'name imageUrl')
        .populate('userId', 'name email')
        .populate('assignedDeliveryId', 'name phone')
        .sort({ createdAt: -1 })

      res.status(200).json(orders)
    } catch (error: any) {
      console.error('Get orders error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

