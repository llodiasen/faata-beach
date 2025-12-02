import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extraire le chemin depuis les query params (Vercel passe le chemin dans req.query.path)
  const pathArray = req.query.path as string[] || []
  const route = pathArray.join('/')

  // Préserver l'URL originale pour les handlers qui l'utilisent (comme orders.ts)
  if (!req.url || !req.url.startsWith('/api')) {
    req.url = `/api/${route}`
  }
  
  console.log('[Router] Route détectée:', route, 'Path array:', pathArray)

  // Router vers le bon handler selon le chemin
  try {
    // Route: /api/auth?action=login
    if (route === 'auth' || route.startsWith('auth')) {
      const authHandler = (await import('../server/handlers/auth.js')).default
      return authHandler(req, res)
    }

    // Route: /api/categories ou /api/categories/:id
    if (route === 'categories' || route.startsWith('categories/')) {
      // Extraire l'ID si présent: /api/categories/123 -> id = 123
      const idMatch = route.match(/^categories\/(.+)$/)
      if (idMatch) {
        req.query.id = idMatch[1]
      }
      const categoriesHandler = (await import('../server/handlers/categories.js')).default
      return categoriesHandler(req, res)
    }

    // Route: /api/products ou /api/products/:id
    if (route === 'products' || route.startsWith('products/')) {
      // Extraire l'ID si présent: /api/products/123 -> id = 123
      const idMatch = route.match(/^products\/(.+)$/)
      if (idMatch) {
        req.query.id = idMatch[1]
      }
      const productsHandler = (await import('../server/handlers/products.js')).default
      return productsHandler(req, res)
    }

    // Route: /api/orders ou /api/orders/:id ou /api/orders/delivery/assigned
    if (route === 'orders' || route.startsWith('orders/')) {
      // Extraire l'ID si présent: /api/orders/123 -> id = 123
      // Mais pas pour les routes spéciales comme /api/orders/delivery/assigned
      if (!route.includes('/delivery/')) {
        const idMatch = route.match(/^orders\/([^/]+)$/)
        if (idMatch) {
          req.query.id = idMatch[1]
        }
      }
      const ordersHandler = (await import('../server/handlers/orders.js')).default
      return ordersHandler(req, res)
    }

    // Route: /api/push
    if (route === 'push') {
      const pushHandler = (await import('../server/handlers/push.js')).default
      return pushHandler(req, res)
    }

    // Route: /api/reservations ou /api/reservations/:id
    if (route === 'reservations' || route.startsWith('reservations/')) {
      // Extraire l'ID si présent: /api/reservations/123 -> id = 123
      const idMatch = route.match(/^reservations\/(.+)$/)
      if (idMatch) {
        req.query.id = idMatch[1]
      }
      const reservationsHandler = (await import('../server/handlers/reservations.js')).default
      return reservationsHandler(req, res)
    }

    // Route: /api/users/:action
    if (route === 'users' || route.startsWith('users/')) {
      const usersHandler = (await import('../server/handlers/users.js')).default
      // Extraire l'action du chemin: /api/users/profile -> action = profile
      const actionMatch = route.match(/^users\/(.+)$/)
      if (actionMatch) {
        req.query.action = actionMatch[1]
      }
      return usersHandler(req, res)
    }

    // Route non trouvée
    console.error('[Router] Route non trouvée:', route)
    return res.status(404).json({ message: 'Route non trouvée', path: `/api/${route}` })
  } catch (error: any) {
    console.error('[Router] Erreur dans le routeur:', error)
    return res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error?.message || 'Erreur inconnue' 
    })
  }
}

