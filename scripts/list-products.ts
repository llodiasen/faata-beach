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

const { Product, Category } = await import('../api/lib/models.js')

async function listProducts() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || ''
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI non défini')
      process.exit(1)
    }

    console.log('🔌 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB\n')

    // Rechercher les produits contenant "Glace" ou "Mousse"
    console.log('🔍 Recherche des produits contenant "Glace" ou "Mousse"...\n')
    
    const glaceProducts = await Product.find({ name: /Glace/i }).populate('categoryId', 'name')
    const mousseProducts = await Product.find({ name: /Mousse/i }).populate('categoryId', 'name')
    
    if (glaceProducts.length > 0) {
      console.log('📦 Produits contenant "Glace":')
      glaceProducts.forEach(p => {
        console.log(`   - "${p.name}" (Catégorie: ${(p.categoryId as any)?.name || 'N/A'})`)
      })
      console.log()
    }
    
    if (mousseProducts.length > 0) {
      console.log('📦 Produits contenant "Mousse":')
      mousseProducts.forEach(p => {
        console.log(`   - "${p.name}" (Catégorie: ${(p.categoryId as any)?.name || 'N/A'})`)
      })
      console.log()
    }
    
    if (glaceProducts.length === 0 && mousseProducts.length === 0) {
      console.log('⚠️  Aucun produit trouvé contenant "Glace" ou "Mousse"')
    }

    // Lister tous les produits de la catégorie Desserts
    const dessertsCategory = await Category.findOne({ name: /Desserts/i })
    if (dessertsCategory) {
      const dessertsProducts = await Product.find({ categoryId: dessertsCategory._id })
      console.log(`\n🍰 Tous les produits de la catégorie "Desserts" (${dessertsProducts.length}):`)
      dessertsProducts.forEach(p => {
        console.log(`   - "${p.name}"`)
      })
    }

    await mongoose.disconnect()
    console.log('\n✅ Déconnexion de MongoDB')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

listProducts()

