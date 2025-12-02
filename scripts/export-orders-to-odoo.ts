import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
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
const { Order, Product, Category } = await import('../api/lib/models.js')

// ============================================
// MAPPING DES STATUTS APP → ODOO
// ============================================
const statusMapping: Record<string, string> = {
  'pending': 'draft',
  'accepted': 'sent',
  'preparing': 'sent',
  'ready': 'sale',
  'assigned': 'sale',
  'on_the_way': 'sale',
  'delivered': 'done',
  'cancelled': 'cancel',
}

// ============================================
// FONCTION POUR ÉCHAPPER LES VALEURS CSV
// ============================================
function escapeCSV(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

// ============================================
// FONCTION POUR GÉNÉRER LE CSV DES COMMANDES
// ============================================
function generateOrdersCSV(orders: Array<{
  orderNumber: string
  date: string
  customerName: string
  customerPhone: string
  customerEmail: string
  orderType: string
  tableNumber: string
  deliveryAddress: string
  status: string
  totalAmount: number
  items: string
}>): string {
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Order Type',
    'Table Number',
    'Delivery Address',
    'Status',
    'Total Amount',
    'Items (JSON)'
  ]
  
  const rows = orders.map(order => [
    order.orderNumber,
    order.date,
    order.customerName,
    order.customerPhone,
    order.customerEmail,
    order.orderType,
    order.tableNumber,
    order.deliveryAddress,
    order.status,
    order.totalAmount,
    order.items
  ])
  
  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ]
  
  return csvLines.join('\n')
}

// ============================================
// FONCTION POUR GÉNÉRER LE CSV DES LIGNES DE COMMANDE
// ============================================
function generateOrderLinesCSV(orderLines: Array<{
  orderNumber: string
  productExternalId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}>): string {
  const headers = [
    'Order Number',
    'Product External ID',
    'Product Name',
    'Quantity',
    'Unit Price',
    'Subtotal'
  ]
  
  const rows = orderLines.map(line => [
    line.orderNumber,
    line.productExternalId,
    line.productName,
    line.quantity,
    line.unitPrice,
    line.subtotal
  ])
  
  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ]
  
  return csvLines.join('\n')
}

async function exportOrdersToOdoo() {
  try {
    console.log('🚀 Export des commandes de l\'app vers Odoo\n')
    console.log('='.repeat(60))

    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB\n')

    // Récupérer toutes les commandes
    console.log('📦 Récupération des commandes...')
    const orders = await Order.find()
      .populate('items.productId')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec()
    
    console.log(`✅ ${orders.length} commande(s) trouvée(s)\n`)

    if (orders.length === 0) {
      console.log('⚠️  Aucune commande à exporter!')
      await mongoose.disconnect()
      process.exit(0)
    }

    // Récupérer tous les produits pour mapper les External IDs
    const products = await Product.find()
    const productMap = new Map<string, string>()
    
    products.forEach(product => {
      if (product.description) {
        const idMatch = product.description.match(/\[Odoo ID:\s*(.*?)\]/)
        if (idMatch) {
          productMap.set(product._id.toString(), idMatch[1].trim())
        }
      }
    })

    // Transformer les commandes au format Odoo
    const odooOrders: Array<{
      orderNumber: string
      date: string
      customerName: string
      customerPhone: string
      customerEmail: string
      orderType: string
      tableNumber: string
      deliveryAddress: string
      status: string
      totalAmount: number
      items: string
    }> = []

    const odooOrderLines: Array<{
      orderNumber: string
      productExternalId: string
      productName: string
      quantity: number
      unitPrice: number
      subtotal: number
    }> = []

    let ordersWithProducts = 0
    let ordersWithoutProducts = 0

    orders.forEach((order, index) => {
      const orderNumber = `ORD-${order._id.toString().substring(0, 8).toUpperCase()}-${index + 1}`
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      
      // Récupérer les infos client
      let customerName = ''
      let customerPhone = ''
      let customerEmail = ''
      
      if (order.userId && typeof order.userId === 'object') {
        customerName = (order.userId as any).name || ''
        customerEmail = (order.userId as any).email || ''
        customerPhone = (order.userId as any).phone || ''
      }
      
      if (order.customerInfo) {
        customerName = order.customerInfo.name || customerName
        customerPhone = order.customerInfo.phone || customerPhone
        customerEmail = order.customerInfo.email || customerEmail
      }

      // Type de commande
      const orderTypeMap: Record<string, string> = {
        'sur_place': 'Sur place',
        'emporter': 'À emporter',
        'livraison': 'Livraison'
      }
      const orderType = orderTypeMap[order.orderType] || order.orderType

      // Adresse de livraison
      let deliveryAddress = ''
      if (order.deliveryAddress) {
        deliveryAddress = order.deliveryAddress.fullAddress || ''
        if (order.deliveryAddress.street) {
          deliveryAddress += `, ${order.deliveryAddress.street}`
        }
        if (order.deliveryAddress.city) {
          deliveryAddress += `, ${order.deliveryAddress.city}`
        }
      }

      // Statut Odoo
      const odooStatus = statusMapping[order.status] || 'draft'

      // Items
      const items: Array<{
        productExternalId: string
        productName: string
        quantity: number
        unitPrice: number
        subtotal: number
      }> = []

      let hasAllProducts = true

      order.items.forEach(item => {
        const productId = item.productId.toString()
        const productExternalId = productMap.get(productId) || ''
        
        if (!productExternalId) {
          hasAllProducts = false
        }

        items.push({
          productExternalId: productExternalId || `UNKNOWN-${productId.substring(0, 8)}`,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity
        })

        // Ajouter la ligne de commande
        odooOrderLines.push({
          orderNumber,
          productExternalId: productExternalId || `UNKNOWN-${productId.substring(0, 8)}`,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity
        })
      })

      if (hasAllProducts) {
        ordersWithProducts++
      } else {
        ordersWithoutProducts++
      }

      odooOrders.push({
        orderNumber,
        date,
        customerName: customerName || 'Client invité',
        customerPhone: customerPhone || '',
        customerEmail: customerEmail || '',
        orderType,
        tableNumber: order.tableNumber || '',
        deliveryAddress,
        status: odooStatus,
        totalAmount: order.totalAmount,
        items: JSON.stringify(items)
      })
    })

    console.log(`✅ ${ordersWithProducts} commande(s) avec produits mappés`)
    if (ordersWithoutProducts > 0) {
      console.log(`⚠️  ${ordersWithoutProducts} commande(s) avec produits non mappés (External ID manquant)`)
    }
    console.log('')

    // Créer le dossier exports s'il n'existe pas
    const exportsDir = join(__dirname, '..', 'exports')
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true })
    }

    // Générer les fichiers CSV
    console.log('📝 Génération des fichiers CSV...')
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    
    // CSV des commandes
    const ordersCSV = generateOrdersCSV(odooOrders)
    const ordersFilePath = join(exportsDir, `odoo-orders-export-${timestamp}.csv`)
    writeFileSync(ordersFilePath, ordersCSV, 'utf-8')
    console.log(`✅ Fichier commandes: ${ordersFilePath}`)

    // CSV des lignes de commande
    const orderLinesCSV = generateOrderLinesCSV(odooOrderLines)
    const orderLinesFilePath = join(exportsDir, `odoo-order-lines-export-${timestamp}.csv`)
    writeFileSync(orderLinesFilePath, orderLinesCSV, 'utf-8')
    console.log(`✅ Fichier lignes de commande: ${orderLinesFilePath}`)

    // Résumé par statut
    const statusCounts = new Map<string, number>()
    odooOrders.forEach(o => {
      statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1)
    })

    console.log('\n📊 Commandes exportées par statut Odoo:')
    statusCounts.forEach((count, status) => {
      console.log(`   - ${status}: ${count} commande(s)`)
    })

    // Résumé par type
    const typeCounts = new Map<string, number>()
    odooOrders.forEach(o => {
      typeCounts.set(o.orderType, (typeCounts.get(o.orderType) || 0) + 1)
    })

    console.log('\n📊 Commandes exportées par type:')
    typeCounts.forEach((count, type) => {
      console.log(`   - ${type}: ${count} commande(s)`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ Export terminé avec succès!')
    console.log('='.repeat(60))
    console.log('\n📌 Prochaines étapes:')
    console.log('   1. Ouvrez Odoo → Ventes → Commandes')
    console.log('   2. Importez le fichier CSV des commandes')
    console.log('   3. Importez le fichier CSV des lignes de commande')
    console.log('   4. Vérifiez que les produits sont bien liés via External ID\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'export:', error)
    process.exit(1)
  }
}

exportOrdersToOdoo()

