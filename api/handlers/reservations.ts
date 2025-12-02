import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Reservation, User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB()

    const id = req.query.id as string

    // Si un ID est fourni, gérer les opérations sur une réservation spécifique
    if (id && typeof id === 'string') {
      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const { userId, role } = verifyToken(token)
      const user = await User.findById(userId)
      
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' })
      }

      if (req.method === 'GET') {
        const reservation = await Reservation.findById(id)
        if (!reservation) {
          return res.status(404).json({ message: 'Réservation non trouvée' })
        }

        if (role === 'admin' || (reservation.userId && reservation.userId.toString() === userId)) {
          return res.status(200).json(reservation)
        } else {
          return res.status(403).json({ message: 'Accès refusé' })
        }
      } else if (req.method === 'PATCH') {
        if (role !== 'admin') {
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
        return res.status(200).json(reservation)
      } else if (req.method === 'DELETE') {
        const reservation = await Reservation.findById(id)
        if (!reservation) {
          return res.status(404).json({ message: 'Réservation non trouvée' })
        }

        if (role === 'admin' || (reservation.userId && reservation.userId.toString() === userId)) {
          reservation.status = 'cancelled'
          await reservation.save()
          return res.status(200).json({ message: 'Réservation annulée', reservation })
        } else {
          return res.status(403).json({ message: 'Accès refusé' })
        }
      }
    }

    // Sinon, gérer les opérations sur la liste des réservations
    if (req.method === 'POST') {
      const { customerInfo, date, time, numberOfGuests, notes } = req.body
      
      if (!customerInfo || !customerInfo.name || !customerInfo.phone || !date || !time || !numberOfGuests) {
        return res.status(400).json({ message: 'Informations requises manquantes' })
      }
      
      let userId = null
      const token = getTokenFromRequest(req)
      if (token) {
        try {
          const { userId: tokenUserId } = verifyToken(token)
          userId = tokenUserId
        } catch (error) {
          // Token invalide, on continue sans userId
        }
      }

      const reservation = new Reservation({
        userId: userId || null,
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
        },
        date: new Date(date),
        time,
        numberOfGuests,
        notes,
      })

      await reservation.save()
      return res.status(201).json(reservation)
    } else if (req.method === 'GET') {
      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const { userId, role } = verifyToken(token)
      const user = await User.findById(userId)
      
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' })
      }
      
      let query: any = {}
      if (role !== 'admin') {
        query = { userId }
      }

      const reservations = await Reservation.find(query).sort({ date: 1, time: 1 })
      return res.status(200).json(reservations)
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Reservations error:', error)
    if (error.message === 'Token invalide') {
      return res.status(401).json({ message: 'Token invalide' })
    }
    res.status(500).json({ message: error.message || 'Erreur serveur' })
  }
}
