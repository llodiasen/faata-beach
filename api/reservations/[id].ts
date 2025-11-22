import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Reservation, User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // GET : Détails d'une réservation
    try {
      await connectDB()
      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const { id } = req.query
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'ID de réservation requis' })
      }

      const { userId, role } = verifyToken(token)
      const user = await User.findById(userId)
      
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' })
      }

      const reservation = await Reservation.findById(id)
      if (!reservation) {
        return res.status(404).json({ message: 'Réservation non trouvée' })
      }

      // Vérifier les permissions
      if (role === 'admin' || (reservation.userId && reservation.userId.toString() === userId)) {
        res.status(200).json(reservation)
      } else {
        return res.status(403).json({ message: 'Accès refusé' })
      }
    } catch (error: any) {
      console.error('Get reservation error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else if (req.method === 'PATCH') {
    // PATCH : Mettre à jour le statut (admin seulement)
    try {
      await connectDB()
      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const { id } = req.query
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'ID de réservation requis' })
      }

      const { userId, role } = verifyToken(token)
      const user = await User.findById(userId)
      
      if (!user || role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé - Admin requis' })
      }

      const { status } = req.body
      const reservation = await Reservation.findById(id)
      if (!reservation) {
        return res.status(404).json({ message: 'Réservation non trouvée' })
      }

      if (status) {
        reservation.status = status
      }

      await reservation.save()
      res.status(200).json(reservation)
    } catch (error: any) {
      console.error('Update reservation error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else if (req.method === 'DELETE') {
    // DELETE : Annuler une réservation
    try {
      await connectDB()
      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const { id } = req.query
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'ID de réservation requis' })
      }

      const { userId, role } = verifyToken(token)
      const user = await User.findById(userId)
      
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' })
      }

      const reservation = await Reservation.findById(id)
      if (!reservation) {
        return res.status(404).json({ message: 'Réservation non trouvée' })
      }

      // Vérifier les permissions (admin ou propriétaire)
      if (role === 'admin' || (reservation.userId && reservation.userId.toString() === userId)) {
        reservation.status = 'cancelled'
        await reservation.save()
        res.status(200).json({ message: 'Réservation annulée', reservation })
      } else {
        return res.status(403).json({ message: 'Accès refusé' })
      }
    } catch (error: any) {
      console.error('Cancel reservation error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

