import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import connectDB from '../lib/mongodb.js'
import { PushSubscription, User } from '../lib/models.js'
import { getTokenFromRequest, verifyToken } from '../lib/auth.js'

const ensureVapidKeys = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    throw new Error('Clés VAPID manquantes. Configurez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY.')
  }
  webpush.setVapidDetails('mailto:contact@faata-beach.com', publicKey, privateKey)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query

  // Route: /api/push?action=subscribe (POST/DELETE)
  if (action === 'subscribe') {
    if (!['POST', 'DELETE'].includes(req.method || '')) {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
      await connectDB()

      const token = getTokenFromRequest(req)
      let userId: string | null = null

      if (token) {
        try {
          const payload = verifyToken(token)
          userId = payload.userId
        } catch {
          // Ignorer les tokens invalides pour permettre un abonnement invité
        }
      }

      if (req.method === 'POST') {
        const { subscription, tags = [], deviceInfo } = req.body || {}

        if (
          !subscription ||
          typeof subscription.endpoint !== 'string' ||
          !subscription.keys?.p256dh ||
          !subscription.keys?.auth
        ) {
          return res.status(400).json({ message: 'Subscription invalide' })
        }

        const normalizedTags = Array.isArray(tags)
          ? tags
              .map((tag: unknown) => (typeof tag === 'string' ? tag.trim().toLowerCase() : null))
              .filter(Boolean)
          : []

        await PushSubscription.findOneAndUpdate(
          { endpoint: subscription.endpoint },
          {
            userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            tags: normalizedTags,
            deviceInfo: {
              platform: deviceInfo?.platform,
              browser: deviceInfo?.browser,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        )

        return res.status(201).json({ success: true })
      }

      if (req.method === 'DELETE') {
        const { endpoint } = req.body || {}
        if (!endpoint || typeof endpoint !== 'string') {
          return res.status(400).json({ message: 'Endpoint requis' })
        }

        await PushSubscription.findOneAndDelete({ endpoint })
        return res.status(200).json({ success: true })
      }
    } catch (error) {
      console.error('Push subscribe handler error:', error)
      return res.status(500).json({ message: 'Erreur serveur' })
    }
  }

  // Route: /api/push?action=send (POST - admin only)
  if (action === 'send') {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
      ensureVapidKeys()
      await connectDB()

      const token = getTokenFromRequest(req)
      if (!token) {
        return res.status(401).json({ message: 'Non autorisé' })
      }

      const payload = verifyToken(token)
      const adminUser = await User.findById(payload.userId)
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ message: 'Réservé aux administrateurs' })
      }

      const { title, body, url, tag, userId, tags } = req.body || {}
      if (!title || !body) {
        return res.status(400).json({ message: 'Titre et message requis' })
      }

      const criteria: Record<string, any> = {}
      if (userId) {
        criteria.userId = userId
      }
      if (tag) {
        criteria.tags = tag
      }
      if (Array.isArray(tags) && tags.length > 0) {
        criteria.tags = { $in: tags }
      }

      const subscriptions = await PushSubscription.find(criteria)
      if (!subscriptions.length) {
        return res.status(200).json({ sent: 0, total: 0 })
      }

      const notificationPayload = JSON.stringify({
        title,
        body,
        url,
        tag,
      })

      let sentCount = 0

      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: subscription.keys,
              },
              notificationPayload,
            )
            sentCount += 1
          } catch (error: any) {
            const statusCode = error?.statusCode
            if (statusCode === 410 || statusCode === 404) {
              await PushSubscription.deleteOne({ _id: subscription._id })
            } else {
              console.error('Erreur envoi notification push:', error)
            }
          }
        }),
      )

      return res.status(200).json({ sent: sentCount, total: subscriptions.length })
    } catch (error: any) {
      console.error('Push send handler error:', error)
      return res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  }

  return res.status(400).json({ message: 'Action invalide. Utilisez ?action=subscribe ou ?action=send' })
}
