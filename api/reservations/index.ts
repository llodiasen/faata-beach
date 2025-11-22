import type { VercelRequest, VercelResponse } from '@vercel/node'
import connectDB from '../lib/mongodb.js'
import { Reservation, User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // POST : Créer une réservation
    try {
      await connectDB()
      const { customerInfo, date, time, numberOfGuests, notes } = req.body
      
      if (!customerInfo || !customerInfo.name || !customerInfo.phone || !date || !time || !numberOfGuests) {
        return res.status(400).json({ message: 'Informations requises manquantes' })
      }
      
      // Récupérer userId si token présent
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
      res.status(201).json(reservation)
    } catch (error: any) {
      console.error('Create reservation error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else if (req.method === 'GET') {
    // GET : Obtenir les réservations (admin ou user)
    try {
      await connectDB()
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
        // Client voit seulement ses réservations
        query = { userId }
      }

      const reservations = await Reservation.find(query).sort({ date: 1, time: 1 })
      res.status(200).json(reservations)
    } catch (error: any) {
      console.error('Get reservations error:', error)
      if (error.message === 'Token invalide') {
        return res.status(401).json({ message: 'Token invalide' })
      }
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

