import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement AVANT d'importer les modèles
const envPath = join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// Vérifier que MONGODB_URI est chargé
if (!process.env.MONGODB_URI) {
  // Essayer de lire directement le fichier .env
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

// Importer les modèles après avoir chargé les variables d'environnement
const { Product } = await import('../api/lib/models.js')

// Liste des produits à supprimer
const productsToDelete = [
  'Glace 2 boules',
  'Mousse passion',
  'Cordon bleu',
  'Sole Colbert',
  'Gratin dauphinois'
]

async function deleteProducts() {
  try {
    // Connexion à MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || ''
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI non défini dans les variables d\'environnement')
      process.exit(1)
    }

    console.log('🔌 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB\n')

    // Rechercher et supprimer les produits
    console.log('🔍 Recherche des produits à supprimer...\n')
    
    let deletedCount = 0
    let notFoundCount = 0

    for (const productName of productsToDelete) {
      const product = await Product.findOne({ name: productName })
      
      if (product) {
        await Product.deleteOne({ _id: product._id })
        console.log(`✅ Supprimé: ${productName}`)
        deletedCount++
      } else {
        console.log(`⚠️  Non trouvé: ${productName}`)
        notFoundCount++
      }
    }

    console.log('\n📊 Résumé:')
    console.log(`   ✅ Supprimés: ${deletedCount}`)
    console.log(`   ⚠️  Non trouvés: ${notFoundCount}`)
    console.log(`   📝 Total recherchés: ${productsToDelete.length}`)

    await mongoose.disconnect()
    console.log('\n✅ Déconnexion de MongoDB')
    console.log('✨ Suppression terminée avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

deleteProducts()

