import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
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
const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI n\'est pas défini dans .env')
}

// Importer les modèles directement sans utiliser mongodb.ts
const { Category, Product } = await import('../api/lib/models.js')

// ============================================
// MAPPING DES CATÉGORIES APP → CATÉGORIES ODOO
// ============================================
const categoryMapping: Record<string, string> = {
  'Accompagnements': 'Accompagnements',
  'Boissons': 'Boissons',
  'Desserts': 'Desserts',
  'Entrées': 'Entrées',
  'Plats — À base de fruits de mer': 'Fruits de Mer',
  'Pizzas': 'Pizzas',
  'Plats — À base de poisson': 'Poisson',
  'Plats — À base de poulet': 'Poulet',
  'Plats — À base de viande': 'Viande',
}

// ============================================
// FONCTION POUR ÉCHAPPER LES VALEURS CSV
// ============================================
function escapeCSV(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  
  // Si la valeur contient des guillemets, des virgules ou des retours à la ligne, l'entourer de guillemets
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

// ============================================
// FONCTION POUR GÉNÉRER L'EXTERNAL ID
// ============================================
function generateExternalId(productName: string, index: number): string {
  // Nettoyer le nom pour créer un External ID valide
  const cleanName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50)
  
  return `product_template_${cleanName}_${index + 1}`
}

// ============================================
// FONCTION POUR GÉNÉRER LA RÉFÉRENCE INTERNE
// ============================================
function generateInternalReference(productName: string, categoryName: string): string {
  // Créer une référence basée sur la catégorie et le nom
  const categoryPrefix: Record<string, string> = {
    'Accompagnements': 'ACC',
    'Boissons': 'BOI',
    'Desserts': 'DES',
    'Entrées': 'ENT',
    'Fruits de Mer': 'FRM',
    'Pizzas': 'PIZ',
    'Poisson': 'POI',
    'Poulet': 'POU',
    'Viande': 'VIA',
  }
  
  const prefix = categoryPrefix[categoryName] || 'PROD'
  const cleanName = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8)
  
  return `${prefix}-${cleanName}`
}

// ============================================
// FONCTION POUR NETTOYER LA DESCRIPTION
// ============================================
function cleanDescription(description: string | undefined): string {
  if (!description) return ''
  
  // Retirer l'External ID Odoo s'il existe déjà dans la description
  return description
    .replace(/\s*\[Odoo ID:.*?\]\s*/g, '')
    .replace(/\s*Réf:.*?\|/g, '')
    .replace(/\s*Coût:.*?\|/g, '')
    .replace(/\s*Poids:.*?\|/g, '')
    .replace(/\|/g, '')
    .trim()
}

// ============================================
// FONCTION POUR GÉNÉRER LE CSV
// ============================================
function generateCSV(products: Array<{
  externalId: string
  name: string
  productType: string
  internalReference: string
  barcode: string
  salesPrice: number
  cost: string
  weight: string
  salesDescription: string
  category: string
}>): string {
  // En-têtes du CSV Odoo
  const headers = [
    'External ID',
    'Name',
    'Product Type',
    'Internal Reference',
    'Barcode',
    'Sales Price',
    'Cost',
    'Weight',
    'Sales Description',
    'Category'
  ]
  
  // Générer les lignes CSV
  const rows = products.map(product => [
    product.externalId,
    product.name,
    product.productType,
    product.internalReference,
    product.barcode,
    product.salesPrice,
    product.cost,
    product.weight,
    product.salesDescription,
    product.category
  ])
  
  // Construire le CSV
  const csvLines = [
    headers.map(escapeCSV).join(','), // En-tête
    ...rows.map(row => row.map(escapeCSV).join(',')) // Lignes de données
  ]
  
  return csvLines.join('\n')
}

async function exportToOdoo() {
  try {
    console.log('🚀 Export des produits de l\'app vers Odoo\n')
    console.log('='.repeat(60))

    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB\n')

    // Récupérer toutes les catégories
    const categories = await Category.find({ isActive: true }).populate('_id').exec()
    console.log(`📋 ${categories.length} catégorie(s) trouvée(s)\n`)

    // Créer un mapping categoryId → nom de catégorie
    const categoryMap = new Map<string, string>()
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat.name)
    })

    // Récupérer tous les produits avec leurs catégories
    console.log('📦 Récupération des produits...')
    const products = await Product.find({ isAvailable: true })
      .populate('categoryId')
      .sort({ displayOrder: 1 })
      .exec()
    
    console.log(`✅ ${products.length} produit(s) trouvé(s)\n`)

    if (products.length === 0) {
      console.log('⚠️  Aucun produit à exporter!')
      await mongoose.disconnect()
      process.exit(0)
    }

    // Transformer les produits au format Odoo
    const odooProducts: Array<{
      externalId: string
      name: string
      productType: string
      internalReference: string
      barcode: string
      salesPrice: number
      cost: string
      weight: string
      salesDescription: string
      category: string
    }> = []

    // Mapping pour mettre à jour les produits MongoDB avec l'ID Odoo
    const productUpdates: Array<{
      productId: mongoose.Types.ObjectId
      externalId: string
      name: string
    }> = []

    let mappedCount = 0
    let unmappedCount = 0

    products.forEach((product, index) => {
      // Récupérer le nom de la catégorie
      let categoryName = ''
      if (product.categoryId && typeof product.categoryId === 'object') {
        categoryName = (product.categoryId as any).name || ''
      } else {
        categoryName = categoryMap.get(product.categoryId.toString()) || ''
      }

      // Mapper la catégorie App vers Odoo
      const odooCategory = categoryMapping[categoryName]
      
      if (!odooCategory) {
        console.warn(`⚠️  Catégorie "${categoryName}" non mappée pour le produit "${product.name}"`)
        unmappedCount++
        return
      }

      mappedCount++

      // Nettoyer la description (retirer les métadonnées Odoo si présentes)
      const cleanDesc = cleanDescription(product.description)

      // Extraire le coût depuis la description si présent
      let cost = ''
      if (product.description) {
        const costMatch = product.description.match(/Coût:\s*(\d+)\s*FCFA/i)
        if (costMatch) {
          cost = costMatch[1]
        }
      }

      // Extraire le poids depuis la description si présent
      let weight = ''
      if (product.description) {
        const weightMatch = product.description.match(/Poids:\s*([\d.,]+)\s*kg/i)
        if (weightMatch) {
          weight = weightMatch[1]
        }
      }

      // Extraire l'External ID depuis la description si présent
      let externalId = generateExternalId(product.name, index)
      if (product.description) {
        const idMatch = product.description.match(/\[Odoo ID:\s*(.*?)\]/)
        if (idMatch) {
          externalId = idMatch[1].trim()
        }
      }

      // Extraire la référence interne depuis la description si présente
      let internalReference = generateInternalReference(product.name, odooCategory)
      if (product.description) {
        const refMatch = product.description.match(/Réf:\s*([^|]+)/)
        if (refMatch) {
          internalReference = refMatch[1].trim()
        }
      }

      odooProducts.push({
        externalId,
        name: product.name,
        productType: 'Goods', // Tous les produits sont des marchandises
        internalReference,
        barcode: '', // Pas de code-barres par défaut
        salesPrice: product.price, // Prix déjà en CFA
        cost: cost || '',
        weight: weight || '',
        salesDescription: cleanDesc,
        category: odooCategory
      })

      // Stocker pour mise à jour MongoDB
      productUpdates.push({
        productId: product._id,
        externalId,
        name: product.name
      })
    })

    console.log(`✅ ${mappedCount} produit(s) mappé(s) vers Odoo`)
    if (unmappedCount > 0) {
      console.log(`⚠️  ${unmappedCount} produit(s) ignoré(s) (catégorie non mappée)`)
    }
    console.log('')

    // Générer le CSV
    console.log('📝 Génération du fichier CSV...')
    const csvContent = generateCSV(odooProducts)

    // Créer le dossier exports s'il n'existe pas
    const exportsDir = join(__dirname, '..', 'exports')
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true })
    }

    // Sauvegarder le fichier CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const csvFilePath = join(exportsDir, `odoo-products-export-${timestamp}.csv`)
    
    writeFileSync(csvFilePath, csvContent, 'utf-8')
    
    console.log(`✅ Fichier CSV généré: ${csvFilePath}`)
    console.log(`📄 ${odooProducts.length} produit(s) exporté(s)\n`)

    // Afficher le résumé par catégorie
    const categoryCounts = new Map<string, number>()
    odooProducts.forEach(p => {
      categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1)
    })

    console.log('📊 Produits exportés par catégorie Odoo:')
    categoryCounts.forEach((count, category) => {
      console.log(`   - ${category}: ${count} produit(s)`)
    })
    console.log('')

    // Afficher quelques exemples
    console.log('📋 Exemples de produits exportés:')
    odooProducts.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name} (${p.category}) - ${p.salesPrice} FCFA`)
    })
    if (odooProducts.length > 5) {
      console.log(`   ... et ${odooProducts.length - 5} autres`)
    }
    console.log('')

    // Mettre à jour les produits MongoDB avec l'ID Odoo dans leur description
    console.log('🔄 Mise à jour des produits MongoDB avec les IDs Odoo...')
    let updatedCount = 0
    let errorCount = 0

    for (const update of productUpdates) {
      try {
        const product = await Product.findById(update.productId)
        if (!product) {
          console.warn(`⚠️  Produit ${update.productId} introuvable`)
          errorCount++
          continue
        }

        // Nettoyer l'ancien ID Odoo s'il existe
        let newDescription = product.description || ''
        newDescription = newDescription.replace(/\s*\[Odoo ID:.*?\]\s*/g, '').trim()

        // Ajouter le nouvel ID Odoo
        const odooIdTag = `[Odoo ID: ${update.externalId}]`
        
        if (newDescription) {
          // Si la description existe, ajouter l'ID Odoo à la fin
          newDescription = `${newDescription} ${odooIdTag}`
        } else {
          // Si pas de description, créer juste l'ID Odoo
          newDescription = odooIdTag
        }

        // Mettre à jour le produit
        await Product.findByIdAndUpdate(update.productId, {
          description: newDescription
        })

        updatedCount++
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour du produit ${update.name}:`, error)
        errorCount++
      }
    }

    console.log(`✅ ${updatedCount} produit(s) mis à jour avec l'ID Odoo`)
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} erreur(s) lors de la mise à jour`)
    }
    console.log('')

    console.log('='.repeat(60))
    console.log('✅ Export terminé avec succès!')
    console.log('='.repeat(60))
    console.log('\n📌 Prochaines étapes:')
    console.log('   1. Ouvrez Odoo → Produits → Action → Importer')
    console.log('   2. Sélectionnez le fichier CSV généré')
    console.log('   3. Vérifiez le mapping des colonnes')
    console.log('   4. Lancez l\'importation')
    console.log('   5. ✅ Les produits MongoDB ont déjà été mis à jour avec les IDs Odoo!\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'export:', error)
    process.exit(1)
  }
}

exportToOdoo()

