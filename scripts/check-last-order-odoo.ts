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

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI n\'est pas défini dans .env')
}

// Importer les modèles
const { Order } = await import('../api/lib/models.js')

async function checkLastOrder() {
  try {
    console.log('🔍 Vérification de la dernière commande\n')
    console.log('='.repeat(60))

    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB\n')

    // Récupérer la dernière commande
    const lastOrder = await Order.findOne()
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name description')
      .exec()

    if (!lastOrder) {
      console.log('❌ Aucune commande trouvée dans MongoDB')
      await mongoose.disconnect()
      process.exit(0)
    }

    console.log('📦 DERNIÈRE COMMANDE TROUVÉE:')
    console.log('='.repeat(60))
    console.log(`ID MongoDB: ${lastOrder._id}`)
    console.log(`Date: ${lastOrder.createdAt}`)
    console.log(`Type: ${lastOrder.orderType}`)
    console.log(`Statut: ${lastOrder.status}`)
    console.log(`Total: ${lastOrder.totalAmount} FCFA`)
    console.log(`\n✅ ID Odoo: ${lastOrder.odooOrderId || '❌ AUCUN'}`)
    console.log('')

    if (lastOrder.odooOrderId) {
      console.log('✅ La commande a été synchronisée avec Odoo!')
      console.log(`   ID Odoo: ${lastOrder.odooOrderId}`)
    } else {
      console.log('⚠️  La commande n\'a PAS été synchronisée avec Odoo')
      console.log('')
      console.log('🔍 Vérifications à faire:')
      console.log('   1. Vérifier les logs Vercel dans l\'onglet "Functions" → "/api/orders"')
      console.log('   2. Vérifier les variables d\'environnement Odoo dans Vercel')
      console.log('   3. Vérifier que les produits ont bien un ID Odoo dans leur description')
    }

    console.log('')
    console.log('📋 PRODUITS DE LA COMMANDE:')
    console.log('='.repeat(60))
    for (const item of lastOrder.items) {
      const product = item.productId as any
      const description = product?.description || 'Pas de description'
      const hasOdooId = description.includes('[Odoo ID:')
      
      console.log(`\n- ${item.name}`)
      console.log(`  Quantité: ${item.quantity}`)
      console.log(`  Prix: ${item.price} FCFA`)
      console.log(`  ID Odoo: ${hasOdooId ? '✅ Oui' : '❌ Non'}`)
      if (hasOdooId) {
        const idMatch = description.match(/\[Odoo ID:\s*(.*?)\]/)
        if (idMatch) {
          console.log(`  External ID: ${idMatch[1].trim()}`)
        }
      }
    }

    console.log('')
    console.log('='.repeat(60))

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

checkLastOrder()

