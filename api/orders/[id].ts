import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Order, User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // GET : Obtenir une commande
    try {
      await connectDB()

      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'ID de commande requis' })
      }

      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const payload = verifyToken(token)
      const { userId } = payload
      let role = payload.role
      
      // Si le rôle n'est pas dans le token, vérifier en base
      if (!role) {
        const user = await User.findById(userId)
        if (!user) {
          return res.status(401).json({ message: 'Utilisateur non trouvé' })
        }
        role = user.role
      }

      const order = await Order.findById(id)
        .populate('items.productId', 'name imageUrl')
        .populate('userId', 'name email')
        .populate('assignedDeliveryId', 'name phone')

      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' })
      }

      // Vérifier les permissions
      if (role === 'admin' || role === 'delivery') {
        // Admin et livreur peuvent voir toutes les commandes
        res.status(200).json(order)
      } else if (order.userId && order.userId.toString() === userId) {
        // Client peut voir ses propres commandes
        res.status(200).json(order)
      } else {
        return res.status(403).json({ message: 'Accès refusé' })
      }
    } catch (error: any) {
      console.error('Get order error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else if (req.method === 'PATCH') {
    // PATCH : Mettre à jour le statut d'une commande
    try {
      await connectDB()
      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const { id } = req.query
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'ID de commande requis' })
      }

      const payload = verifyToken(token)
      const { userId } = payload
      let role = payload.role
      
      // Si le rôle n'est pas dans le token, vérifier en base
      if (!role) {
        const user = await User.findById(userId)
        if (!user) {
          return res.status(401).json({ message: 'Utilisateur non trouvé' })
        }
        role = user.role
      }

      const { status, assignedDeliveryId } = req.body

      const order = await Order.findById(id)
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' })
      }

      // Vérifier les permissions
      if (role === 'admin') {
        // Admin peut tout modifier
        if (status) {
          order.status = status
        }
        if (assignedDeliveryId !== undefined) {
          order.assignedDeliveryId = assignedDeliveryId || null
        }
      } else if (role === 'delivery') {
        // Livreur ne peut mettre à jour que ses propres commandes
        if (order.assignedDeliveryId?.toString() !== userId) {
          return res.status(403).json({ message: 'Accès refusé - Cette commande ne vous est pas assignée' })
        }
        // Livreur peut seulement passer à on_the_way ou delivered
        if (status && ['on_the_way', 'delivered'].includes(status)) {
          order.status = status
        } else if (status) {
          return res.status(403).json({ message: 'Statut non autorisé pour un livreur' })
        }
      } else {
        return res.status(403).json({ message: 'Accès refusé' })
      }

      await order.save()
      await order.populate('items.productId', 'name imageUrl')
      await order.populate('assignedDeliveryId', 'name phone')
      
      res.status(200).json(order)
    } catch (error: any) {
      console.error('Update order error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

