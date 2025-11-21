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

// Fonction pour obtenir les extras selon la catégorie (prix en CFA Sénégalais)
function getExtrasForCategory(categoryName: string): Array<{ name: string; price: number }> {
  const extras: Record<string, Array<{ name: string; price: number }>> = {
    'Burgers': [
      { name: 'Fromage supplémentaire', price: 500 },
      { name: 'Bacon supplémentaire', price: 800 },
      { name: 'Œuf', price: 500 },
      { name: 'Oignons frits', price: 300 },
      { name: 'Champignons', price: 500 },
      { name: 'Sauce supplémentaire', price: 200 },
    ],
    'Pizzas': [
      { name: 'Fromage supplémentaire', price: 800 },
      { name: 'Champignons', price: 600 },
      { name: 'Olives', price: 500 },
      { name: 'Jambon supplémentaire', price: 900 },
      { name: 'Légumes supplémentaires', price: 400 },
    ],
    'Plats Mer': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Salade supplémentaire', price: 600 },
      { name: 'Sauce piquante', price: 300 },
      { name: 'Citron supplémentaire', price: 200 },
    ],
    'Plats Terre': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Salade supplémentaire', price: 600 },
      { name: 'Sauce piquante', price: 300 },
      { name: 'Légumes supplémentaires', price: 400 },
    ],
    'Sandwichs & Wraps': [
      { name: 'Fromage supplémentaire', price: 500 },
      { name: 'Avocat', price: 600 },
      { name: 'Légumes supplémentaires', price: 400 },
      { name: 'Sauce supplémentaire', price: 200 },
      { name: 'Bacon supplémentaire', price: 800 },
    ],
    'Boissons': [
      { name: 'Glace supplémentaire', price: 300 },
      { name: 'Sirop supplémentaire', price: 400 },
      { name: 'Menthe supplémentaire', price: 300 },
    ],
    'Snacks & Tapas': [
      { name: 'Sauce supplémentaire', price: 300 },
      { name: 'Fromage supplémentaire', price: 500 },
    ],
    'Desserts': [
      { name: 'Chantilly supplémentaire', price: 400 },
      { name: 'Noix supplémentaires', price: 500 },
      { name: 'Sauce chocolat', price: 400 },
      { name: 'Fruits supplémentaires', price: 600 },
    ],
    'Menu Enfant': [
      { name: 'Sauce supplémentaire', price: 300 },
      { name: 'Fromage supplémentaire', price: 500 },
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
        { "name": "Coca-Cola", "price": 1000, "image": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sprite", "price": 1000, "image": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fanta Orange", "price": 1000, "image": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Ice Tea Pêche", "price": 1200, "image": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Eau minérale", "price": 800, "image": "https://images.unsplash.com/photo-1548839140-5a6d0e05be54?w=800&h=800&fit=crop&auto=format" },
        { "name": "Eau gazeuse", "price": 900, "image": "https://images.unsplash.com/photo-1548839140-5a6d0e05be54?w=800&h=800&fit=crop&auto=format" },
        { "name": "Faata Fresh", "price": 2500, "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sunset Beach", "price": 2800, "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Virgin Mojito", "price": 3000, "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Snacks & Tapas",
      "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Frites Faata", "price": 2000, "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Frites Manioc", "price": 2200, "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Nuggets (6 pcs)", "price": 3500, "image": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fish Fingers (6 pcs)", "price": 4000, "image": "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=800&fit=crop&auto=format" },
        { "name": "Samoussas poulet (4 pcs)", "price": 3000, "image": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=800&fit=crop&auto=format" },
        { "name": "Beignets de crevettes (6 pcs)", "price": 4500, "image": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Burgers",
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Burger Classic", "price": 4500, "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cheese & Bacon", "price": 5500, "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=800&fit=crop&auto=format" },
        { "name": "Faata Chicken Burger", "price": 5000, "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Burger Poisson", "price": 5000, "image": "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats Mer",
      "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Poisson grillé", "price": 6500, "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poisson cru à la tahitienne", "price": 7500, "image": "https://images.unsplash.com/photo-1574781330858-c0ff99397e2e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Crevettes ail & persil", "price": 8000, "image": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats Terre",
      "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Poulet curry coco", "price": 6500, "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poulet grillé BBQ", "price": 6000, "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=800&fit=crop&auto=format" },
        { "name": "Steak grillé", "price": 8500, "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Pizzas",
      "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Margherita", "price": 5000, "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Reine", "price": 6000, "image": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&h=800&fit=crop&auto=format" },
        { "name": "4 Fromages", "price": 6500, "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop&auto=format" },
        { "name": "Tropicale", "price": 6200, "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop&auto=format" },
        { "name": "Faata Spéciale", "price": 6800, "image": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Sandwichs & Wraps",
      "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Tacos poulet", "price": 4000, "image": "https://images.unsplash.com/photo-1606643965684-5d2b5d42beb7?w=800&h=800&fit=crop&auto=format" },
        { "name": "Wrap chicken crispy", "price": 4500, "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=800&fit=crop&auto=format" },
        { "name": "Panini jambon-fromage", "price": 3500, "image": "https://images.unsplash.com/photo-1559496417-e7f25cb24745?w=800&h=800&fit=crop&auto=format" },
        { "name": "Panini poulet BBQ", "price": 4000, "image": "https://images.unsplash.com/photo-1604909993693-4e7ae6d55afd?w=800&h=800&fit=crop&auto=format" }
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
    },
    {
      "name": "Menu Enfant",
      "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Nuggets (4 pcs) + frites + boisson", "price": 4500, "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=800&fit=crop&auto=format" },
        { "name": "Mini burger + frites + boisson", "price": 5000, "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop&auto=format" }
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
        
        // Les prix sont déjà en CFA (pas de conversion nécessaire)
        const product = new Product({
          categoryId: category._id,
          name: productData.name,
          price: productData.price, // Prix déjà en CFA
          imageUrl: productData.image,
          extras: categoryExtras, // Ajouter les extras de la catégorie
          isAvailable: true,
          displayOrder: productIndex + 1
        })
        
        await product.save()
        console.log(`   ✅ Produit créé: ${product.name} (${productData.price} CFA) - ${categoryExtras.length} extras`)
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

