import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
const envPath = join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// Vérifier que MONGODB_URI est chargé
if (!process.env.MONGODB_URI) {
  try {
    const envFile = readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')
    for (const line of lines) {
      const match = line.match(/^MONGODB_URI=(.+)$/)
      if (match) {
        process.env.MONGODB_URI = match[1].trim()
        break
      }
    }
  } catch (e) {
    console.error('Erreur lors de la lecture du fichier .env:', e)
  }
}

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI n\'est pas défini dans .env')
}

// Importer les modèles
const { User } = await import('../api/lib/models.js')

const usersToCreate = [
  {
    name: 'Admin Faata',
    email: 'admin@faata.beach',
    password: 'admin123',
    role: 'admin' as const,
    phone: '+221 XX XXX XX XX',
  },
  {
    name: 'Livreur 1',
    email: 'livreur1@faata.beach',
    password: 'livreur123',
    role: 'delivery' as const,
    phone: '+221 XX XXX XX XX',
  },
  {
    name: 'Livreur 2',
    email: 'livreur2@faata.beach',
    password: 'livreur123',
    role: 'delivery' as const,
    phone: '+221 XX XXX XX XX',
  },
  {
    name: 'Client Test',
    email: 'client@faata.beach',
    password: 'client123',
    role: 'customer' as const,
    phone: '+221 XX XXX XX XX',
  },
]

async function createUsers() {
  try {
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB\n')

    // Charger bcrypt une seule fois (comme dans login.ts)
    let bcrypt: any
    try {
      // Essayer d'abord avec createRequire
      const { createRequire } = await import('module')
      const { fileURLToPath } = await import('url')
      const __filename = fileURLToPath(import.meta.url)
      const require = createRequire(__filename)
      bcrypt = require('bcryptjs')
      
      if (!bcrypt || typeof bcrypt.hash !== 'function') {
        // Fallback: import dynamique
        const bcryptjsModule = await import('bcryptjs')
        bcrypt = bcryptjsModule.default || bcryptjsModule
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors du chargement de bcryptjs:`, error.message)
      throw error
    }
    
    if (!bcrypt || typeof bcrypt.hash !== 'function') {
      throw new Error('bcrypt.hash is not available')
    }

    for (const userData of usersToCreate) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email })
      
      if (existingUser) {
        console.log(`⚠️  Utilisateur existant: ${userData.email} (${existingUser.role})`)
        
        // Rehasher le mot de passe avec la bonne méthode
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        
        // Mettre à jour l'utilisateur (rôle et mot de passe)
        existingUser.role = userData.role
        existingUser.password = hashedPassword
        existingUser.name = userData.name
        existingUser.phone = userData.phone
        await existingUser.save()
        
        console.log(`   ✅ Utilisateur mis à jour: ${userData.name}`)
        console.log(`   📧 Email: ${userData.email}`)
        console.log(`   🔑 Mot de passe: ${userData.password} (rehashé)`)
        console.log(`   👤 Rôle: ${userData.role}`)
        console.log('')
        continue
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: userData.role,
      })

      await user.save()
      console.log(`✅ Utilisateur créé: ${userData.name}`)
      console.log(`   📧 Email: ${userData.email}`)
      console.log(`   🔑 Mot de passe: ${userData.password}`)
      console.log(`   👤 Rôle: ${userData.role}`)
      console.log('')
    }

    console.log('🎉 Création des utilisateurs terminée!\n')
    console.log('📋 RÉSUMÉ DES COMPTES DE TEST:')
    console.log('─'.repeat(50))
    console.log('🔴 ADMIN:')
    console.log('   Email: admin@faata.beach')
    console.log('   Mot de passe: admin123')
    console.log('   → Accès: /dashboard-admin')
    console.log('')
    console.log('🚚 LIVREURS:')
    console.log('   Email: livreur1@faata.beach ou livreur2@faata.beach')
    console.log('   Mot de passe: livreur123')
    console.log('   → Accès: /dashboard-livreur')
    console.log('')
    console.log('👤 CLIENT:')
    console.log('   Email: client@faata.beach')
    console.log('   Mot de passe: client123')
    console.log('   → Accès: /profile')
    console.log('─'.repeat(50))

  } catch (error: any) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Déconnecté de MongoDB')
  }
}

createUsers()

