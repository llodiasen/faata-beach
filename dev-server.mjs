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

  // Routes API avec paramètres d'abord (plus spécifiques)
  app.all('/api/categories/:id', createApiRoute('/api/categories/:id', './api/categories/[id].ts', true))
  app.all('/api/products/:id', createApiRoute('/api/products/:id', './api/products/[id].ts', true))
  app.all('/api/orders/:id', createApiRoute('/api/orders/:id', './api/orders/[id].ts', true))

  // Routes API sans paramètres (moins spécifiques)
  app.all('/api/categories', createApiRoute('/api/categories', './api/categories/index.ts'))
  app.all('/api/products', createApiRoute('/api/products', './api/products/index.ts'))
  app.all('/api/orders', createApiRoute('/api/orders', './api/orders/index.ts'))

  // Routes API - Auth
  app.use('/api/auth/login', async (req, res) => {
    console.log('🔵 [DEV-SERVER] Login request received - Method:', req.method)
    console.log('🔵 [DEV-SERVER] Login request body:', { email: req.body?.email, hasPassword: !!req.body?.password })
    try {
      console.log('🔵 [DEV-SERVER] Loading login handler...')
      const handler = await import('./api/auth/login.ts')
      console.log('🔵 [DEV-SERVER] Login handler loaded, creating Vercel request/response...')
      const vercelReq = createVercelRequest(req)
      const vercelRes = createVercelResponse(res)
      console.log('🔵 [DEV-SERVER] Calling login handler...')
      await handler.default(vercelReq, vercelRes)
      console.log('🔵 [DEV-SERVER] Login handler completed')
    } catch (error) {
      console.error('🔴 [DEV-SERVER] Login API Error:', error)
      console.error('🔴 [DEV-SERVER] Error stack:', error.stack)
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || 'Erreur serveur' })
      }
    }
  })

  app.use('/api/auth/register', async (req, res) => {
    try {
      const handler = await import('./api/auth/register.ts')
      const vercelReq = createVercelRequest(req)
      const vercelRes = createVercelResponse(res)
      await handler.default(vercelReq, vercelRes)
    } catch (error) {
      console.error('Register API Error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
    }
  })

  app.use('/api/auth/profile', async (req, res) => {
    try {
      const handler = await import('./api/auth/profile.ts')
      const vercelReq = createVercelRequest(req)
      const vercelRes = createVercelResponse(res)
      await handler.default(vercelReq, vercelRes)
    } catch (error) {
      console.error('Profile API Error:', error)
      res.status(500).json({ message: error.message || 'Erreur serveur' })
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

