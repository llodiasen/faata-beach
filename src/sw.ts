/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import type { PrecacheEntry } from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'faata-pages',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/images/'),
  new CacheFirst({
    cacheName: 'faata-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'faata-static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

// Routes API - NetworkFirst avec gestion d'erreur améliorée
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'faata-api-cache',
    networkTimeoutSeconds: 10, // Augmenter le timeout
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

setCatchHandler(async ({ event }) => {
  const fetchEvent = event as FetchEvent
  if (fetchEvent.request?.mode === 'navigate') {
    const cache = await caches.open('faata-pages')
    const cachedResponse = await cache.match('/offline.html')
    if (cachedResponse) return cachedResponse
    return Response.redirect('/offline.html')
  }
  return Response.error()
})

self.addEventListener('push', (event: PushEvent) => {
  const payload = (() => {
    if (!event.data) return {}
    try {
      return event.data.json()
    } catch {
      return { title: 'FAATA Beach', body: event.data.text() }
    }
  })()

  const title = payload.title || 'FAATA Beach'
  const options: NotificationOptions = {
    body: payload.body || 'Nouvelle notification',
    icon: payload.icon || '/images/logo.png',
    badge: '/images/logo.png',
    data: {
      url: payload.url || '/',
      ...payload.data,
    },
    tag: payload.tag,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      const existingClient = allClients.find(client => 'focus' in client && client.url.includes(new URL(url, self.location.origin).pathname))
      if (existingClient && 'focus' in existingClient) {
        await existingClient.focus()
        return
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(url)
      }
    })(),
  )
})

