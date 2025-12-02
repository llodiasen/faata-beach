import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extraire le chemin depuis les query params (Vercel passe le chemin dans req.query.path)
  const pathArray = req.query.path as string[] || []
  const route = pathArray.join('/')

  // Si pathArray est vide, essayer d'extraire depuis req.url
  let finalRoute = route
  if (!finalRoute && req.url) {
    const urlPath = req.url.replace(/^\/api/, '').split('?')[0]
    finalRoute = urlPath.split('/').filter(Boolean).join('/')
  }

  // Préserver l'URL originale pour les handlers qui l'utilisent (comme orders.ts)
  if (!req.url || !req.url.startsWith('/api')) {
    req.url = `/api/${finalRoute}`
  }
  
  console.log('[Router] Route détectée:', finalRoute, 'Path array:', pathArray, 'URL:', req.url)

  // Router vers le bon handler selon le chemin
  try {
    // Route: /api/auth?action=login
    if (finalRoute === 'auth' || finalRoute.startsWith('auth')) {
      const authHandler = (await import('../server/handlers/auth.js')).default
      return authHandler(req, res)
    }

    // Route: /api/categories ou /api/categories/:id
    if (finalRoute === 'categories' || finalRoute.startsWith('categories/')) {
      // Extraire l'ID si présent: /api/categories/123 -> id = 123
      const idMatch = finalRoute.match(/^categories\/(.+)$/)
      if (idMatch) {
        req.query.id = idMatch[1]
      }
      const categoriesHandler = (await import('../server/handlers/categories.js')).default
      return categoriesHandler(req, res)
    }

    // Route: /api/products ou /api/products/:id
    if (finalRoute === 'products' || finalRoute.startsWith('products/')) {
      // Extraire l'ID si présent: /api/products/123 -> id = 123
      const idMatch = finalRoute.match(/^products\/(.+)$/)
      if (idMatch) {
        req.query.id = idMatch[1]
      }
      const productsHandler = (await import('../server/handlers/products.js')).default
      return productsHandler(req, res)
    }

    // Route: /api/orders ou /api/orders/:id ou /api/orders/delivery/assigned
    if (finalRoute === 'orders' || finalRoute.startsWith('orders/')) {
      // Extraire l'ID si présent: /api/orders/123 -> id = 123
      // Mais pas pour les routes spéciales comme /api/orders/delivery/assigned
      if (!finalRoute.includes('/delivery/')) {
        const idMatch = finalRoute.match(/^orders\/([^/]+)$/)
        if (idMatch) {
          req.query.id = idMatch[1]
        }
      }
      const ordersHandler = (await import('../server/handlers/orders.js')).default
      return ordersHandler(req, res)
    }

    // Route: /api/push
    if (finalRoute === 'push') {
      const pushHandler = (await import('../server/handlers/push.js')).default
      return pushHandler(req, res)
    }

    // Route: /api/reservations ou /api/reservations/:id
    if (finalRoute === 'reservations' || finalRoute.startsWith('reservations/')) {
      // Extraire l'ID si présent: /api/reservations/123 -> id = 123
      const idMatch = finalRoute.match(/^reservations\/(.+)$/)
      if (idMatch) {
        req.query.id = idMatch[1]
      }
      const reservationsHandler = (await import('../server/handlers/reservations.js')).default
      return reservationsHandler(req, res)
    }

    // Route: /api/users/:action
    if (finalRoute === 'users' || finalRoute.startsWith('users/')) {
      const usersHandler = (await import('../server/handlers/users.js')).default
      // Extraire l'action du chemin: /api/users/profile -> action = profile
      const actionMatch = finalRoute.match(/^users\/(.+)$/)
      if (actionMatch) {
        req.query.action = actionMatch[1]
      }
      return usersHandler(req, res)
    }

    // Route non trouvée
    console.error('[Router] Route non trouvée:', finalRoute, 'Path array:', pathArray)
    return res.status(404).json({ message: 'Route non trouvée', path: `/api/${finalRoute}` })
  } catch (error: any) {
    console.error('[Router] Erreur dans le routeur:', error)
    return res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error?.message || 'Erreur inconnue' 
    })
  }
}

