import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from './lib/mongodb.js'
import { Order, Product, User } from './lib/models.js'
import { getTokenFromRequest, verifyToken } from './lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  const url = req.url || ''

  // Route spéciale: /api/orders/delivery/assigned - Commandes assignées au livreur
  if (url.includes('/delivery/assigned')) {
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
      const { userId } = payload
      let role = payload.role
      
      // Si le rôle n'est pas dans le token, vérifier en base
      if (!role) {
        const user = await User.findById(userId)
        if (!user) {
          return res.status(403).json({ message: 'Utilisateur non trouvé' })
        }
        role = user.role
      }
      
      // Vérifier que l'utilisateur est un livreur
      if (role !== 'delivery') {
        return res.status(403).json({ message: 'Accès refusé - Rôle livreur requis' })
      }

      // Récupérer les commandes assignées à ce livreur avec statuts assign ou on_the_way
      const orders = await Order.find({
        assignedDeliveryId: userId,
        status: { $in: ['assigned', 'on_the_way'] },
      })
        .populate('items.productId', 'name imageUrl')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })

      return res.status(200).json(orders)
    } catch (error: any) {
      console.error('Get assigned orders error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      return res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  }

  // Route: /api/orders (GET/POST) - Liste ou création
  if (!id) {
    if (req.method === 'POST') {
      // Créer une commande
      try {
        await connectDB()

        const { items, tableNumber, orderType, deliveryAddress, customerInfo, note } = req.body

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

          // Utiliser le prix envoyé depuis le frontend (qui inclut les extras)
          // mais valider qu'il est raisonnable (au moins le prix de base, max 3x le prix de base)
          const basePrice = product.price
          const sentPrice = item.price || basePrice
          
          // Validation de sécurité : le prix doit être au moins égal au prix de base
          // et ne pas dépasser 3x le prix de base (pour éviter les manipulations)
          if (sentPrice < basePrice) {
            return res.status(400).json({
              message: `Prix invalide pour le produit ${product.name}. Prix minimum: ${basePrice} FCFA`,
            })
          }
          
          // Limite de sécurité : prix max = 3x le prix de base (pour gérer les extras)
          const maxPrice = basePrice * 3
          if (sentPrice > maxPrice) {
            return res.status(400).json({
              message: `Prix invalide pour le produit ${product.name}. Prix maximum autorisé: ${maxPrice} FCFA`,
            })
          }

          const itemTotal = sentPrice * item.quantity
          totalAmount += itemTotal

          orderItems.push({
            productId: product._id,
            quantity: item.quantity,
            price: sentPrice, // Utiliser le prix avec extras
            name: item.name || product.name, // Utiliser le nom avec extras si fourni
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
          note: note || undefined,
        })

        await order.save()
        await order.populate('items.productId', 'name imageUrl')

        // Synchroniser avec Odoo (en arrière-plan, ne pas bloquer la réponse)
        console.log('🔄 Tentative de synchronisation Odoo...')
        try {
          const { createOdooSalesOrder } = await import('./lib/odoo.js')
          console.log('✅ Module Odoo importé avec succès')
          
          // Préparer les données pour Odoo
          const productsForOdoo = orderItems.map((item, index) => ({
            productId: item.productId,
            item: orderItems[index]
          }))

          console.log(`📦 ${productsForOdoo.length} produit(s) à synchroniser avec Odoo`)

          // Appeler Odoo (ne pas attendre la réponse pour ne pas bloquer)
          createOdooSalesOrder(order, productsForOdoo).then(odooOrderId => {
            if (odooOrderId) {
              console.log(`✅ Commande Odoo créée avec ID: ${odooOrderId}`)
              // Mettre à jour la commande avec l'ID Odoo
              Order.findByIdAndUpdate(order._id, { odooOrderId }).catch(err => {
                console.error('❌ Erreur mise à jour odooOrderId:', err)
              })
            } else {
              console.warn('⚠️  Synchronisation Odoo terminée mais aucun ID retourné')
            }
          }).catch(err => {
            console.error('❌ Erreur synchronisation Odoo:', err)
            if (err instanceof Error) {
              console.error('   Message:', err.message)
              console.error('   Stack:', err.stack)
            }
            // Ne pas bloquer la création de commande si Odoo échoue
          })
        } catch (odooError) {
          console.error('❌ Erreur import module Odoo:', odooError)
          if (odooError instanceof Error) {
            console.error('   Message:', odooError.message)
            console.error('   Stack:', odooError.stack)
          }
          // Continuer même si le module Odoo ne peut pas être chargé
        }

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
    return
  }

  // Route: /api/orders?id=xxx (GET/PATCH) - Détail ou mise à jour
  if (typeof id === 'string') {
    if (req.method === 'GET') {
      // GET : Obtenir une commande
      try {
        await connectDB()

        const order = await Order.findById(id)
          .populate('items.productId', 'name imageUrl')
          .populate('userId', 'name email')
          .populate('assignedDeliveryId', 'name phone')

        if (!order) {
          return res.status(404).json({ message: 'Commande non trouvée' })
        }

        const token = getTokenFromRequest(req)
        
        // Si pas de token, permettre l'accès seulement pour les commandes récentes (moins de 1 heure)
        if (!token) {
          const orderAge = Date.now() - new Date(order.createdAt).getTime()
          const oneHour = 60 * 60 * 1000
          
          if (orderAge < oneHour) {
            // Commande récente, permettre l'accès sans token (pour la page thank-you)
            return res.status(200).json(order)
          } else {
            return res.status(401).json({ message: 'Non autorisé - Token requis pour les commandes anciennes' })
          }
        }

        // Si token présent, vérifier les permissions normalement
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
    return
  }

  res.status(400).json({ message: 'ID invalide' })
}
