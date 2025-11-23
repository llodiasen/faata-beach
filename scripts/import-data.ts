import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement AVANT d'importer mongodb
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
// On doit définir MONGODB_URI avant d'importer les modèles
const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI n\'est pas défini dans .env')
}

// Importer les modèles directement sans utiliser mongodb.ts
const { Category, Product } = await import('../api/lib/models.js')

// Les prix sont maintenant directement en CFA (Franc CFA Sénégalais)
// Plus besoin de conversion, les prix sont déjà adaptés au marché sénégalais

// Fonction pour obtenir les temps de préparation et livraison selon la catégorie
function getDeliveryTimesForCategory(categoryName: string): { preparationTime: number; deliveryTime: number } {
  const times: Record<string, { preparationTime: number; deliveryTime: number }> = {
    'Entrées': { preparationTime: 10, deliveryTime: 15 }, // 10 min préparation + 15 min livraison = 25 min total
    'Plats — À base de poisson': { preparationTime: 20, deliveryTime: 20 }, // 20 min préparation + 20 min livraison = 40 min total
    'Plats — À base de fruits de mer': { preparationTime: 25, deliveryTime: 20 }, // 25 min préparation + 20 min livraison = 45 min total
    'Plats — À base de poulet': { preparationTime: 18, deliveryTime: 20 }, // 18 min préparation + 20 min livraison = 38 min total
    'Plats — À base de viande': { preparationTime: 22, deliveryTime: 20 }, // 22 min préparation + 20 min livraison = 42 min total
    'Accompagnements': { preparationTime: 12, deliveryTime: 15 }, // 12 min préparation + 15 min livraison = 27 min total
    'Boissons': { preparationTime: 5, deliveryTime: 15 }, // 5 min préparation + 15 min livraison = 20 min total
    'Desserts': { preparationTime: 8, deliveryTime: 15 }, // 8 min préparation + 15 min livraison = 23 min total
  }
  
  return times[categoryName] || { preparationTime: 15, deliveryTime: 20 } // Valeurs par défaut
}

// Fonction pour obtenir les extras selon la catégorie (prix en CFA Sénégalais)
function getExtrasForCategory(categoryName: string): Array<{ name: string; price: number }> {
  const extras: Record<string, Array<{ name: string; price: number }>> = {
    'Entrées': [
      { name: 'Pain supplémentaire', price: 500 },
      { name: 'Huile d\'olive extra', price: 300 },
      { name: 'Vinaigrette maison', price: 200 },
    ],
    'Plats — À base de poisson': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Salade supplémentaire', price: 600 },
      { name: 'Sauce citron-beurre', price: 300 },
      { name: 'Légumes vapeur', price: 600 },
    ],
    'Plats — À base de fruits de mer': [
      { name: 'Riz pilaf supplémentaire', price: 500 },
      { name: 'Pain grillé', price: 500 },
      { name: 'Citron supplémentaire', price: 200 },
      { name: 'Sauce aïoli', price: 300 },
    ],
    'Plats — À base de poulet': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Salade supplémentaire', price: 600 },
      { name: 'Sauce BBQ supplémentaire', price: 300 },
      { name: 'Légumes sautés', price: 600 },
    ],
    'Plats — À base de viande': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Sauce au poivre', price: 400 },
      { name: 'Légumes sautés', price: 600 },
    ],
    'Accompagnements': [
      { name: 'Sauce supplémentaire', price: 300 },
      { name: 'Beurre supplémentaire', price: 200 },
    ],
    'Boissons': [
      { name: 'Glace supplémentaire', price: 300 },
      { name: 'Sirop supplémentaire', price: 400 },
      { name: 'Menthe fraîche', price: 300 },
    ],
    'Desserts': [
      { name: 'Chantilly supplémentaire', price: 400 },
      { name: 'Noix supplémentaires', price: 500 },
      { name: 'Coulis de fruits', price: 400 },
    ],
  }
  
  return extras[categoryName] || []
}

const data = {
  "categories": [
    {
      "name": "Entrées",
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Salade niçoise", "price": 4000, "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade chef", "price": 4500, "image": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cocktail avocat crevettes", "price": 5000, "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade italienne", "price": 4200, "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade exotique", "price": 4500, "image": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d1?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade chinoise", "price": 4300, "image": "https://images.unsplash.com/photo-1505252585461-04c2a47d63d8?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de poisson",
      "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Brochettes lotte", "price": 6500, "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poisson braisé", "price": 7000, "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Filet lotte pané", "price": 7500, "image": "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sole meunière", "price": 8000, "image": "https://images.unsplash.com/photo-1574781330858-c0ff99397e2e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sole Colbert", "price": 8500, "image": "https://images.unsplash.com/photo-1574781330858-c0ff99397e2e?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de fruits de mer",
      "image": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Crevettes sautées ail", "price": 8000, "image": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=800&fit=crop&auto=format" },
        { "name": "Gambas grillées", "price": 9500, "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de poulet",
      "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Brochettes poulet", "price": 5500, "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poulet grillé", "price": 6000, "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poulet pané", "price": 5800, "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cordon bleu", "price": 6500, "image": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de viande",
      "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Steak grillé", "price": 8500, "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop&auto=format" },
        { "name": "Émincé bœuf", "price": 7500, "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Brochettes mixtes", "price": 7000, "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=800&fit=crop&auto=format" },
        { "name": "Ragoût bœuf", "price": 7200, "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Accompagnements",
      "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Riz pilaf", "price": 1500, "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop&auto=format" },
        { "name": "Riz blanc", "price": 1200, "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop&auto=format" },
        { "name": "Frites", "price": 2000, "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Légumes sautés", "price": 2500, "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Pommes terre sautées", "price": 2200, "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Spaghetti", "price": 2000, "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Gratin dauphinois", "price": 2800, "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Boissons",
      "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Coca-Cola", "price": 1000, "image": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sprite", "price": 1000, "image": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fanta Orange", "price": 1000, "image": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Ice Tea Pêche", "price": 1200, "image": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Eau minérale", "price": 800, "image": "https://images.unsplash.com/photo-1548839140-5a6d0e05be54?w=800&h=800&fit=crop&auto=format" },
        { "name": "Eau gazeuse", "price": 900, "image": "https://images.unsplash.com/photo-1548839140-5a6d0e05be54?w=800&h=800&fit=crop&auto=format" },
        { "name": "Faata Fresh (Jus frais)", "price": 2500, "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sunset Beach (Cocktail sans alcool)", "price": 2800, "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Virgin Mojito", "price": 3000, "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Desserts",
      "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Glace 2 boules", "price": 2500, "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fondant chocolat", "price": 3000, "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=800&fit=crop&auto=format" },
        { "name": "Tarte coco", "price": 2800, "image": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop&auto=format" },
        { "name": "Mousse passion", "price": 3200, "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=800&fit=crop&auto=format" }
      ]
    }
  ]
}

async function importData() {
  try {
    // Connexion directe à MongoDB
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

    // Supprimer les anciennes données (optionnel)
    console.log('🗑️  Suppression des anciennes données...')
    await Category.deleteMany({})
    await Product.deleteMany({})
    console.log('✅ Anciennes données supprimées')

    // Importer les catégories et produits
    for (let categoryIndex = 0; categoryIndex < data.categories.length; categoryIndex++) {
      const categoryData = data.categories[categoryIndex]
      
      // Créer la catégorie
      const category = new Category({
        name: categoryData.name,
        imageUrl: categoryData.image, // Ajouter l'image de la catégorie
        isActive: true,
        displayOrder: categoryIndex + 1
      })
      await category.save()
      console.log(`✅ Catégorie créée: ${category.name} (ID: ${category._id})`)

      // Obtenir les extras et les temps pour cette catégorie
      const categoryExtras = getExtrasForCategory(categoryData.name)
      const deliveryTimes = getDeliveryTimesForCategory(categoryData.name)
      
      // Créer les produits de cette catégorie
      for (let productIndex = 0; productIndex < categoryData.products.length; productIndex++) {
        const productData = categoryData.products[productIndex]
        
        // Les prix sont déjà en CFA (pas de conversion nécessaire)
        const product = new Product({
          categoryId: category._id,
          name: productData.name,
          price: productData.price, // Prix déjà en CFA
          imageUrl: productData.image,
          extras: categoryExtras, // Ajouter les extras de la catégorie
          preparationTime: deliveryTimes.preparationTime, // Temps de préparation en minutes
          deliveryTime: deliveryTimes.deliveryTime, // Temps de livraison en minutes
          isAvailable: true,
          displayOrder: productIndex + 1
        })
        
        await product.save()
        const totalTime = deliveryTimes.preparationTime + deliveryTimes.deliveryTime
        console.log(`   ✅ Produit créé: ${product.name} (${productData.price} CFA) - ${categoryExtras.length} extras - ${totalTime} min (${deliveryTimes.preparationTime} min prép + ${deliveryTimes.deliveryTime} min livraison)`)
      }
    }

    console.log('\n🎉 Importation terminée avec succès!')
    console.log(`📊 ${data.categories.length} catégories créées`)
    const totalProducts = data.categories.reduce((sum, cat) => sum + cat.products.length, 0)
    console.log(`📊 ${totalProducts} produits créés`)

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'importation:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Déconnecté de MongoDB')
  }
}

importData()

