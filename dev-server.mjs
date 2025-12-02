import express from 'express'
import { createServer as createViteServer } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

// Charger les variables d'environnement depuis .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

// Adapter Express pour Vercel Request/Response
function createVercelRequest(req) {
  const vercelReq = {
    ...req,
    method: req.method,
    url: req.url,
    query: { ...req.query },
    body: req.body,
    headers: req.headers,
    params: req.params,
  }
  // Ajouter les paramètres de route au query
  if (req.params) {
    Object.assign(vercelReq.query, req.params)
  }
  return vercelReq
}

function createVercelResponse(res) {
  const vercelRes = {
    ...res,
    status: (code) => {
      res.status(code)
      return vercelRes
    },
    json: (data) => {
      res.json(data)
      return vercelRes
    },
    send: (data) => {
      res.send(data)
      return vercelRes
    },
  }
  return vercelRes
}

async function startServer() {
  const app = express()
  
  // Middleware pour logger toutes les requêtes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`📥 [DEV-SERVER] ${req.method} ${req.path}`)
    }
    next()
  })
  
  // Middleware
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Filtrer les avertissements WebSocket de Vite
  const originalError = console.error
  const originalWarn = console.warn
  const filterWebSocketErrors = (message) => {
    if (typeof message === 'string' && message.includes('WebSocket')) {
      return true // Filtrer ce message
    }
    return false
  }
  
  console.error = (...args) => {
    if (args.some(arg => filterWebSocketErrors(arg))) {
      return // Ignorer silencieusement les erreurs WebSocket
    }
    originalError.apply(console, args)
  }
  
  console.warn = (...args) => {
    if (args.some(arg => filterWebSocketErrors(arg))) {
      return // Ignorer silencieusement les avertissements WebSocket
    }
    originalWarn.apply(console, args)
  }

  // Créer le serveur Vite
  let vite
  try {
    vite = await createViteServer({
      server: { 
        middlewareMode: 'html',
        hmr: false,  // Désactiver HMR pour éviter le conflit de WebSocket
      },
      appType: 'spa',
    })
  } catch (err) {
    // Si erreur liée au WebSocket, réessayer sans configuration spéciale
    if (err.message && err.message.includes('WebSocket')) {
      vite = await createViteServer({
        server: { middlewareMode: 'html' },
        appType: 'spa',
      })
    } else {
      throw err
    }
  }
  
  // Restaurer les fonctions console après l'initialisation
  console.error = originalError
  console.warn = originalWarn

  // Helper pour créer une route API
  function createApiRoute(path, handlerPath, isParamRoute = false) {
    const route = async (req, res) => {
      try {
        const handler = await import(handlerPath)
        const vercelReq = createVercelRequest(req)
        if (isParamRoute && req.params.id) {
          vercelReq.query.id = req.params.id
        }
        const vercelRes = createVercelResponse(res)
        await handler.default(vercelReq, vercelRes)
      } catch (error) {
        console.error(`API Error [${path}]:`, error)
        if (!res.headersSent) {
          res.status(500).json({ message: error.message || 'Erreur serveur' })
        }
      }
    }
    return route
  }

  // Routeur centralisé pour toutes les routes API (compatible avec la structure Vercel)
  app.use('/api', async (req, res, next) => {
    try {
      // Extraire le chemin depuis l'URL
      const path = req.path.replace('/api', '') || ''
      const route = path.split('/').filter(Boolean).join('/')
      
      // Créer un objet req compatible avec Vercel
      const vercelReq = createVercelRequest(req)
      
      // Préserver l'URL originale
      vercelReq.url = req.path
      
      // Router vers le bon handler selon le chemin
      let handler = null
      
      // Route: /api/auth?action=login
      if (route === 'auth' || route.startsWith('auth')) {
        handler = (await import('./server/handlers/auth.js')).default
      }
      // Route: /api/categories ou /api/categories/:id
      else if (route === 'categories' || route.startsWith('categories/')) {
        const idMatch = route.match(/^categories\/(.+)$/)
        if (idMatch) {
          vercelReq.query.id = idMatch[1]
        }
        handler = (await import('./server/handlers/categories.js')).default
      }
      // Route: /api/products ou /api/products/:id
      else if (route === 'products' || route.startsWith('products/')) {
        const idMatch = route.match(/^products\/(.+)$/)
        if (idMatch) {
          vercelReq.query.id = idMatch[1]
        }
        handler = (await import('./server/handlers/products.js')).default
      }
      // Route: /api/orders ou /api/orders/:id ou /api/orders/delivery/assigned
      else if (route === 'orders' || route.startsWith('orders/')) {
        if (!route.includes('/delivery/')) {
          const idMatch = route.match(/^orders\/([^/]+)$/)
          if (idMatch) {
            vercelReq.query.id = idMatch[1]
          }
        }
        handler = (await import('./server/handlers/orders.js')).default
      }
      // Route: /api/push
      else if (route === 'push') {
        handler = (await import('./server/handlers/push.js')).default
      }
      // Route: /api/reservations ou /api/reservations/:id
      else if (route === 'reservations' || route.startsWith('reservations/')) {
        const idMatch = route.match(/^reservations\/(.+)$/)
        if (idMatch) {
          vercelReq.query.id = idMatch[1]
        }
        handler = (await import('./server/handlers/reservations.js')).default
      }
      // Route: /api/users/:action
      else if (route === 'users' || route.startsWith('users/')) {
        const actionMatch = route.match(/^users\/(.+)$/)
        if (actionMatch) {
          vercelReq.query.action = actionMatch[1]
        }
        handler = (await import('./server/handlers/users.js')).default
      }
      
      if (!handler) {
        return res.status(404).json({ message: 'Route non trouvée', path: `/api/${route}` })
      }
      
      const vercelRes = createVercelResponse(res)
      await handler(vercelReq, vercelRes)
    } catch (error) {
      console.error('API Router Error:', error)
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || 'Erreur serveur' })
      }
    }
  })


  // Utiliser Vite pour servir le frontend
  app.use(vite.middlewares)

  const PORT = process.env.PORT || 5173
  app.listen(PORT, () => {
    console.log(`🚀 Serveur de développement démarré sur http://localhost:${PORT}`)
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`)
  })
}

startServer().catch(console.error)

