// Module pour interagir avec l'API Odoo
import type { IOrder, IOrderItem } from './models.js'
import { Product } from './models.js'

interface OdooConfig {
  url: string
  database: string
  username: string
  apiKey: string
}

/**
 * Authentification Odoo et récupération de l'UID
 */
async function getOdooUID(config: OdooConfig): Promise<number | null> {
  try {
    const response = await fetch(`${config.url}/web/session/authenticate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: config.database,
          login: config.username,
          password: config.apiKey,
        },
      }),
    })

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} lors de l'authentification Odoo`)
      return null
    }

    const data = await response.json()
    
    if (data.error) {
      console.error('❌ Erreur authentification Odoo:', data.error)
      return null
    }
    
    return data.result?.uid || null
  } catch (error) {
    console.error('❌ Erreur authentification Odoo:', error)
    return null
  }
}

/**
 * Recherche un produit Odoo par External ID via JSON-RPC
 */
async function findProductByExternalId(
  config: OdooConfig,
  uid: number,
  externalId: string
): Promise<number | null> {
  try {
    // Utiliser ir.model.data pour trouver le produit par External ID
    // Le champ 'name' contient l'external_id complet (module.external_id)
    const response = await fetch(`${config.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            config.database,
            uid,
            config.apiKey,
            'ir.model.data',
            'search_read',
            [[['name', '=', externalId]]],
            { fields: ['res_id', 'model'], limit: 1 }
          ]
        }
      }),
    })

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} lors de la recherche produit`)
      return null
    }

    const data = await response.json()
    
    if (data.error) {
      console.error(`❌ Erreur recherche produit Odoo:`, data.error)
      return null
    }
    
    if (data.result && data.result.length > 0) {
      const record = data.result[0]
      // Vérifier que c'est bien un produit
      if (record.model === 'product.product' || record.model === 'product.template') {
        return record.res_id
      }
    }
    return null
  } catch (error) {
    console.error(`❌ Erreur recherche produit Odoo ${externalId}:`, error)
    return null
  }
}

/**
 * Crée une commande de vente (Sales Order) dans Odoo
 */
export async function createOdooSalesOrder(
  order: IOrder,
  products: Array<{ productId: any; item: IOrderItem }>
): Promise<number | null> {
  console.log('🔍 Vérification configuration Odoo...')
  
  // Vérifier la configuration Odoo
  const config: OdooConfig = {
    url: process.env.ODOO_URL || '',
    database: process.env.ODOO_DATABASE || '',
    username: process.env.ODOO_USERNAME || '',
    apiKey: process.env.ODOO_API_KEY || '',
  }

  console.log('📋 Configuration Odoo:', {
    url: config.url ? '✅ Défini' : '❌ Manquant',
    database: config.database ? '✅ Défini' : '❌ Manquant',
    username: config.username ? '✅ Défini' : '❌ Manquant',
    apiKey: config.apiKey ? '✅ Défini (' + config.apiKey.substring(0, 10) + '...)' : '❌ Manquant',
  })

  if (!config.url || !config.database || !config.username || !config.apiKey) {
    console.warn('⚠️  Configuration Odoo incomplète, synchronisation ignorée')
    console.warn('   Variables manquantes:', {
      url: !config.url,
      database: !config.database,
      username: !config.username,
      apiKey: !config.apiKey,
    })
    return null
  }

  try {
    // Authentification
    const uid = await getOdooUID(config)
    if (!uid) {
      console.error('❌ Impossible de s\'authentifier à Odoo')
      return null
    }

    // Récupérer les External IDs des produits
    const orderLines: Array<any> = []

    for (const { productId, item } of products) {
      // Récupérer l'External ID depuis la description du produit
      const product = await Product.findById(productId)
      if (!product || !product.description) {
        console.warn(`⚠️  Produit ${productId} sans External ID Odoo, ignoré`)
        continue
      }

      const idMatch = product.description.match(/\[Odoo ID:\s*(.*?)\]/)
      if (!idMatch) {
        console.warn(`⚠️  Produit ${product.name} sans External ID Odoo, ignoré`)
        continue
      }

      const externalId = idMatch[1].trim()
      
      // Rechercher le produit dans Odoo
      const odooProductId = await findProductByExternalId(config, uid, externalId)
      if (!odooProductId) {
        console.warn(`⚠️  Produit Odoo ${externalId} introuvable, ignoré`)
        continue
      }

      orderLines.push([0, 0, {
        product_id: odooProductId,
        product_uom_qty: item.quantity,
        price_unit: item.price,
      }])
    }

    if (orderLines.length === 0) {
      console.warn('⚠️  Aucun produit valide pour Odoo, commande non créée')
      return null
    }

    // Préparer les infos client
    const customerName = order.customerInfo?.name || 
                        (order.userId && typeof order.userId === 'object' ? (order.userId as any).name : '') ||
                        'Client invité'

    const customerPhone = order.customerInfo?.phone || ''

    // Préparer la note de commande
    const noteParts: string[] = []
    noteParts.push(`Type: ${order.orderType}`)
    if (order.tableNumber) {
      noteParts.push(`Table: ${order.tableNumber}`)
    }
    if (order.deliveryAddress) {
      noteParts.push(`Adresse: ${order.deliveryAddress.fullAddress}`)
    }
    if ((order as any).note) {
      noteParts.push(`Note: ${(order as any).note}`)
    }
    if (customerName) {
      noteParts.push(`Client: ${customerName}`)
    }
    if (customerPhone) {
      noteParts.push(`Tél: ${customerPhone}`)
    }

    // Créer la commande de vente dans Odoo via JSON-RPC
    const response = await fetch(`${config.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            config.database,
            uid,
            config.apiKey,
            'sale.order',
            'create',
            [{
              client_order_ref: `APP-${order._id.toString().substring(0, 8)}`,
              order_line: orderLines,
              note: noteParts.join('\n'),
            }]
          ]
        }
      }),
    })

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} lors de la création commande Odoo`)
      return null
    }

    const data = await response.json()
    
    if (data.error) {
      console.error('❌ Erreur création commande Odoo:', data.error)
      return null
    }

    const odooOrderId = data.result
    if (odooOrderId) {
      console.log(`✅ Commande Odoo créée avec ID: ${odooOrderId}`)
    } else {
      console.warn('⚠️  Commande Odoo créée mais ID non retourné')
    }
    return odooOrderId || null
  } catch (error) {
    console.error('❌ Erreur lors de la création de la commande Odoo:', error)
    return null
  }
}

