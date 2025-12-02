// Helper pour importer bcryptjs de manière fiable dans un contexte ES modules
let bcryptCache: any = null
let bcryptLoadPromise: Promise<any> | null = null

async function loadBcrypt(): Promise<any> {
  // Si déjà chargé, retourner immédiatement
  if (bcryptCache) {
    return bcryptCache
  }

  // Si un chargement est déjà en cours, attendre qu'il se termine
  if (bcryptLoadPromise) {
    return await bcryptLoadPromise
  }

  // Créer une promesse pour le chargement
  bcryptLoadPromise = (async () => {
    try {
      // Sur Vercel, utiliser uniquement l'import ES modules (plus fiable)
      const bcryptjsModule = await import('bcryptjs')
      
      // bcryptjs peut être exporté de différentes manières
      let bcrypt = bcryptjsModule.default || bcryptjsModule
      
      // Si default n'existe pas ou n'est pas un objet avec compare, utiliser le module directement
      if (!bcrypt || typeof bcrypt !== 'object' || typeof bcrypt.compare !== 'function') {
        bcrypt = bcryptjsModule
      }
      
      // Vérifier que compare existe
      if (!bcrypt || typeof bcrypt.compare !== 'function') {
        throw new Error(`bcrypt.compare is not a function. Module keys: ${Object.keys(bcryptjsModule).join(', ')}`)
      }
      
      bcryptCache = bcrypt
      return bcrypt
    } catch (error: any) {
      console.error('[bcrypt] Failed to load bcryptjs:', error.message)
      console.error('[bcrypt] Error stack:', error.stack)
      bcryptLoadPromise = null // Réinitialiser pour permettre une nouvelle tentative
      throw new Error(`Failed to load bcryptjs: ${error.message}`)
    }
  })()

  return await bcryptLoadPromise
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = await loadBcrypt()
  
  if (!bcrypt) {
    throw new Error('bcryptjs module is not loaded')
  }
  
  if (typeof bcrypt.compare !== 'function') {
    console.error('[bcrypt] comparePassword: compare is not a function')
    console.error('[bcrypt] comparePassword: bcrypt keys:', Object.keys(bcrypt))
    throw new Error('bcrypt.compare is not a function')
  }
  
  try {
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error: any) {
    console.error('[bcrypt] comparePassword execution error:', error)
    throw error
  }
}

export async function hashPassword(password: string, rounds: number = 10): Promise<string> {
  const bcrypt = await loadBcrypt()
  
  if (!bcrypt) {
    throw new Error('bcryptjs module is not loaded')
  }
  
  if (typeof bcrypt.hash !== 'function') {
    console.error('[bcrypt] hashPassword: hash is not a function')
    throw new Error('bcrypt.hash is not a function')
  }
  
  try {
    return await bcrypt.hash(password, rounds)
  } catch (error: any) {
    console.error('[bcrypt] hashPassword execution error:', error)
    throw error
  }
}
