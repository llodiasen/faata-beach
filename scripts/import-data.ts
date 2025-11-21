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

// Taux de conversion EUR vers CFA (1 EUR ≈ 655 CFA)
const EUR_TO_CFA = 655

// Fonction pour convertir les prix de centimes EUR en CFA
function convertPriceToCFA(priceInCentsEUR: number): number {
  const priceInEUR = priceInCentsEUR / 100
  return Math.round(priceInEUR * EUR_TO_CFA)
}

// Fonction pour obtenir les extras selon la catégorie
function getExtrasForCategory(categoryName: string): Array<{ name: string; price: number }> {
  const extras: Record<string, Array<{ name: string; price: number }>> = {
    'Burgers': [
      { name: 'Fromage supplémentaire', price: convertPriceToCFA(30) },
      { name: 'Bacon supplémentaire', price: convertPriceToCFA(45) },
      { name: 'Œuf', price: convertPriceToCFA(30) },
      { name: 'Oignons frits', price: convertPriceToCFA(20) },
      { name: 'Champignons', price: convertPriceToCFA(30) },
      { name: 'Sauce supplémentaire', price: convertPriceToCFA(15) },
    ],
    'Pizzas': [
      { name: 'Fromage supplémentaire', price: convertPriceToCFA(45) },
      { name: 'Champignons', price: convertPriceToCFA(35) },
      { name: 'Olives', price: convertPriceToCFA(30) },
      { name: 'Jambon supplémentaire', price: convertPriceToCFA(50) },
      { name: 'Légumes supplémentaires', price: convertPriceToCFA(20) },
    ],
    'Plats Mer': [
      { name: 'Riz supplémentaire', price: convertPriceToCFA(15) },
      { name: 'Frites supplémentaires', price: convertPriceToCFA(30) },
      { name: 'Salade supplémentaire', price: convertPriceToCFA(20) },
      { name: 'Sauce piquante', price: convertPriceToCFA(15) },
      { name: 'Citron supplémentaire', price: convertPriceToCFA(10) },
    ],
    'Plats Terre': [
      { name: 'Riz supplémentaire', price: convertPriceToCFA(15) },
      { name: 'Frites supplémentaires', price: convertPriceToCFA(30) },
      { name: 'Salade supplémentaire', price: convertPriceToCFA(20) },
      { name: 'Sauce piquante', price: convertPriceToCFA(15) },
      { name: 'Légumes supplémentaires', price: convertPriceToCFA(20) },
    ],
    'Sandwichs & Wraps': [
      { name: 'Fromage supplémentaire', price: convertPriceToCFA(30) },
      { name: 'Avocat', price: convertPriceToCFA(35) },
      { name: 'Légumes supplémentaires', price: convertPriceToCFA(20) },
      { name: 'Sauce supplémentaire', price: convertPriceToCFA(15) },
      { name: 'Bacon supplémentaire', price: convertPriceToCFA(45) },
    ],
    'Boissons': [
      { name: 'Glace supplémentaire', price: convertPriceToCFA(10) },
      { name: 'Sirop supplémentaire', price: convertPriceToCFA(15) },
      { name: 'Menthe supplémentaire', price: convertPriceToCFA(10) },
    ],
    'Snacks & Tapas': [
      { name: 'Sauce supplémentaire', price: convertPriceToCFA(15) },
      { name: 'Fromage supplémentaire', price: convertPriceToCFA(30) },
    ],
    'Desserts': [
      { name: 'Chantilly supplémentaire', price: convertPriceToCFA(15) },
      { name: 'Noix supplémentaires', price: convertPriceToCFA(20) },
      { name: 'Sauce chocolat', price: convertPriceToCFA(15) },
      { name: 'Fruits supplémentaires', price: convertPriceToCFA(25) },
    ],
    'Menu Enfant': [
      { name: 'Sauce supplémentaire', price: convertPriceToCFA(15) },
      { name: 'Fromage supplémentaire', price: convertPriceToCFA(30) },
    ],
  }
  
  return extras[categoryName] || []
}

const data = {
  "categories": [
    {
      "name": "Boissons",
      "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Coca-Cola", "price": 350, "image": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sprite", "price": 350, "image": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fanta Orange", "price": 350, "image": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Ice Tea Pêche", "price": 350, "image": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Eau minérale", "price": 250, "image": "https://images.unsplash.com/photo-1548839140-5a6d0e05be54?w=800&h=800&fit=crop&auto=format" },
        { "name": "Eau gazeuse", "price": 300, "image": "https://images.unsplash.com/photo-1548839140-5a6d0e05be54?w=800&h=800&fit=crop&auto=format" },
        { "name": "Faata Fresh", "price": 600, "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sunset Beach", "price": 650, "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Virgin Mojito", "price": 700, "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Snacks & Tapas",
      "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Frites Faata", "price": 450, "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Frites Manioc", "price": 500, "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Nuggets (6 pcs)", "price": 700, "image": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fish Fingers (6 pcs)", "price": 800, "image": "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=800&fit=crop&auto=format" },
        { "name": "Samoussas poulet (4 pcs)", "price": 600, "image": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=800&fit=crop&auto=format" },
        { "name": "Beignets de crevettes (6 pcs)", "price": 900, "image": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Burgers",
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Burger Classic", "price": 1200, "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cheese & Bacon", "price": 1400, "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=800&fit=crop&auto=format" },
        { "name": "Faata Chicken Burger", "price": 1300, "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Burger Poisson", "price": 1300, "image": "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats Mer",
      "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Poisson grillé", "price": 1500, "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poisson cru à la tahitienne", "price": 1700, "image": "https://images.unsplash.com/photo-1574781330858-c0ff99397e2e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Crevettes ail & persil", "price": 1800, "image": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats Terre",
      "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Poulet curry coco", "price": 1500, "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poulet grillé BBQ", "price": 1400, "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=800&fit=crop&auto=format" },
        { "name": "Steak grillé", "price": 1800, "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Pizzas",
      "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Margherita", "price": 1100, "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Reine", "price": 1300, "image": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&h=800&fit=crop&auto=format" },
        { "name": "4 Fromages", "price": 1400, "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop&auto=format" },
        { "name": "Tropicale", "price": 1350, "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop&auto=format" },
        { "name": "Faata Spéciale", "price": 1450, "image": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Sandwichs & Wraps",
      "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Tacos poulet", "price": 1000, "image": "https://images.unsplash.com/photo-1606643965684-5d2b5d42beb7?w=800&h=800&fit=crop&auto=format" },
        { "name": "Wrap chicken crispy", "price": 1200, "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=800&fit=crop&auto=format" },
        { "name": "Panini jambon-fromage", "price": 850, "image": "https://images.unsplash.com/photo-1559496417-e7f25cb24745?w=800&h=800&fit=crop&auto=format" },
        { "name": "Panini poulet BBQ", "price": 950, "image": "https://images.unsplash.com/photo-1604909993693-4e7ae6d55afd?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Desserts",
      "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Glace 2 boules", "price": 450, "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fondant chocolat", "price": 600, "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=800&fit=crop&auto=format" },
        { "name": "Tarte coco", "price": 550, "image": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop&auto=format" },
        { "name": "Mousse passion", "price": 650, "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Menu Enfant",
      "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Nuggets (4 pcs) + frites + boisson", "price": 900, "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=800&fit=crop&auto=format" },
        { "name": "Mini burger + frites + boisson", "price": 950, "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop&auto=format" }
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

      // Obtenir les extras pour cette catégorie
      const categoryExtras = getExtrasForCategory(categoryData.name)
      
      // Créer les produits de cette catégorie
      for (let productIndex = 0; productIndex < categoryData.products.length; productIndex++) {
        const productData = categoryData.products[productIndex]
        
        // Convertir le prix de centimes EUR en CFA
        const priceInCFA = convertPriceToCFA(productData.price)
        
        const product = new Product({
          categoryId: category._id,
          name: productData.name,
          price: priceInCFA, // Prix en CFA
          imageUrl: productData.image,
          extras: categoryExtras, // Ajouter les extras de la catégorie
          isAvailable: true,
          displayOrder: productIndex + 1
        })
        
        await product.save()
        console.log(`   ✅ Produit créé: ${product.name} (${priceInCFA} CFA) - ${categoryExtras.length} extras`)
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

