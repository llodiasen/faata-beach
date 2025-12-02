import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import mongoose from 'mongoose'
import { Product, Category } from '../api/lib/models.js'

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

// Modifications de prix
const priceUpdates = [
  { name: "Crevettes sautées à l'ail", newPrice: 4000 },
  { name: 'Poulet pané', newPrice: 4000 },
  { name: 'Ragoût de bœuf', newPrice: 7000 },
]

async function updatePricesAndAddIceCreams() {
  console.log('🔌 Connexion à MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connecté à MongoDB\n')

  // 1. Modifier les prix
  console.log('💰 Mise à jour des prix...')
  for (const update of priceUpdates) {
    const result = await Product.updateOne(
      { name: update.name },
      { $set: { price: update.newPrice } }
    )
    
    if (result.matchedCount > 0) {
      if (result.modifiedCount > 0) {
        console.log(`✅ Prix mis à jour: ${update.name} → ${update.newPrice} FCFA`)
      } else {
        console.log(`ℹ️  Prix déjà à jour: ${update.name} (${update.newPrice} FCFA)`)
      }
    } else {
      console.warn(`⚠️  Produit non trouvé: ${update.name}`)
    }
  }

  // 2. Ajouter des glaces dans la catégorie Desserts
  console.log('\n🍦 Ajout des glaces dans la catégorie Desserts...')
  
  const dessertCategory = await Category.findOne({ name: 'Desserts' })
  if (!dessertCategory) {
    console.error('❌ Catégorie "Desserts" non trouvée')
    await mongoose.disconnect()
    return
  }

  // Vérifier si les glaces existent déjà
  const existingIceCreams = await Product.find({
    categoryId: dessertCategory._id,
    name: { $in: ['Glace vanille', 'Glace chocolat', 'Glace fraise', 'Glace 2 boules', 'Glace 3 boules'] }
  })

  const existingNames = existingIceCreams.map(p => p.name)
  console.log(`   Glaces existantes: ${existingNames.length > 0 ? existingNames.join(', ') : 'aucune'}`)

  // Créer les glaces si elles n'existent pas
  const iceCreams = [
    {
      name: 'Glace vanille',
      description: 'Glace vanille crémeuse et onctueuse',
      price: 2000,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format',
      preparationTime: 2,
      deliveryTime: 5,
      isAvailable: true,
      displayOrder: 10,
    },
    {
      name: 'Glace chocolat',
      description: 'Glace au chocolat riche et intense',
      price: 2000,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format',
      preparationTime: 2,
      deliveryTime: 5,
      isAvailable: true,
      displayOrder: 11,
    },
    {
      name: 'Glace fraise',
      description: 'Glace à la fraise fraîche et fruitée',
      price: 2000,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format',
      preparationTime: 2,
      deliveryTime: 5,
      isAvailable: true,
      displayOrder: 12,
    },
    {
      name: 'Glace 2 boules',
      description: 'Deux boules de glace au choix (vanille, chocolat, fraise)',
      price: 3500,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format',
      preparationTime: 3,
      deliveryTime: 5,
      isAvailable: true,
      displayOrder: 13,
    },
    {
      name: 'Glace 3 boules',
      description: 'Trois boules de glace au choix (vanille, chocolat, fraise)',
      price: 5000,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format',
      preparationTime: 3,
      deliveryTime: 5,
      isAvailable: true,
      displayOrder: 14,
    },
  ]

  let addedCount = 0
  for (const iceCream of iceCreams) {
    if (!existingNames.includes(iceCream.name)) {
      const newProduct = new Product({
        ...iceCream,
        categoryId: dessertCategory._id,
      })
      await newProduct.save()
      console.log(`✅ Ajouté: ${iceCream.name} (${iceCream.price} FCFA)`)
      addedCount++
    } else {
      console.log(`ℹ️  Déjà existant: ${iceCream.name}`)
    }
  }

  console.log(`\n📊 Résumé:`)
  console.log(`   ✅ Prix mis à jour: ${priceUpdates.length}`)
  console.log(`   ✅ Glaces ajoutées: ${addedCount}`)
  console.log(`   ℹ️  Glaces existantes: ${existingNames.length}`)

  await mongoose.disconnect()
  console.log('\n✅ Déconnexion de MongoDB')
  console.log('✨ Mise à jour terminée avec succès!')
}

updatePricesAndAddIceCreams().catch(console.error)

