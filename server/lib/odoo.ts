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
 * Authentification Odoo et récupération de l'UID via JSON-RPC
 */
async function getOdooUID(config: OdooConfig): Promise<number | null> {
  try {
    console.log('[Odoo] Tentative d\'authentification...')
    console.log('[Odoo] URL:', config.url)
    console.log('[Odoo] Database:', config.database)
    console.log('[Odoo] Username:', config.username)
    console.log('[Odoo] API Key present:', config.apiKey ? 'OUI (' + config.apiKey.length + ' caracteres)' : 'NON')
    
    // Utiliser JSON-RPC pour l'authentification (méthode standard Odoo)
    const authUrl = `${config.url}/jsonrpc`
    console.log('[Odoo] URL d\'authentification:', authUrl)
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [
            config.database,
            config.username,
            config.apiKey,
            {}
          ]
        },
        id: Math.floor(Math.random() * 1000000)
      }),
    })

    console.log('[Odoo] Reponse HTTP status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Odoo] ERREUR: HTTP ${response.status} lors de l'authentification Odoo`)
      console.error(`[Odoo] Reponse texte:`, errorText)
      return null
    }

    const data = await response.json()
    console.log('[Odoo] Reponse JSON:', JSON.stringify(data).substring(0, 200))
    
    if (data.error) {
      console.error('[Odoo] ERREUR: Authentification Odoo:', JSON.stringify(data.error))
      return null
    }
    
    const uid = data.result
    if (uid && typeof uid === 'number') {
      console.log('[Odoo] SUCCESS: Authentification reussie, UID:', uid)
      return uid
    }
    
    console.error('[Odoo] ERREUR: UID non retourne ou invalide:', uid)
    return null
  } catch (error) {
    console.error('[Odoo] ERREUR: Exception lors de l\'authentification Odoo:', error)
    if (error instanceof Error) {
      console.error('[Odoo]   Message:', error.message)
      console.error('[Odoo]   Stack:', error.stack)
    }
    return null
  }
}

/**
 * Recherche un produit Odoo par External ID via JSON-RPC
 * Utilise xmlid_to_res_id qui est la méthode recommandée par Odoo
 */
async function findProductByExternalId(
  config: OdooConfig,
  uid: number,
  externalId: string
): Promise<number | null> {
  try {
    console.log(`[Odoo] Recherche produit avec External ID: ${externalId}`)
    
    // Essayer d'abord avec xmlid_to_res_id (méthode recommandée)
    // Cette fonction convertit directement un external_id en res_id
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
            'xmlid_to_res_id',
            [externalId],
            {}
          ]
        }
      }),
    })

    if (!response.ok) {
      console.error(`[Odoo] ERREUR: HTTP ${response.status} lors de la recherche produit`)
      return null
    }

    const data = await response.json()
    
    if (data.error) {
      console.error(`[Odoo] ERREUR: Recherche produit Odoo avec xmlid_to_res_id:`, data.error)
      // Si xmlid_to_res_id échoue, essayer avec search_read comme fallback
      console.log(`[Odoo] Tentative avec search_read comme fallback...`)
      return await findProductByExternalIdFallback(config, uid, externalId)
    }
    
    if (data.result && typeof data.result === 'number') {
      console.log(`[Odoo] Produit trouve avec ID: ${data.result}`)
      return data.result
    }
    
    // Si xmlid_to_res_id retourne null ou 0, essayer avec search_read
    console.log(`[Odoo] xmlid_to_res_id n'a pas trouve le produit, tentative avec search_read...`)
    return await findProductByExternalIdFallback(config, uid, externalId)
  } catch (error) {
    console.error(`[Odoo] ERREUR: Recherche produit Odoo ${externalId}:`, error)
    // Essayer avec search_read comme fallback
    return await findProductByExternalIdFallback(config, uid, externalId)
  }
}

/**
 * Méthode de fallback pour rechercher un produit via ir.model.data.search_read
 */
async function findProductByExternalIdFallback(
  config: OdooConfig,
  uid: number,
  externalId: string
): Promise<number | null> {
  try {
    // Essayer plusieurs formats d'external_id possibles
    const possibleIds = [
      externalId, // Format original
      `__export__.${externalId}`, // Format avec module __export__
      `product.${externalId}`, // Format avec module product
    ]
    
    for (const testId of possibleIds) {
      console.log(`[Odoo] Tentative avec External ID: ${testId}`)
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
              [[['name', '=', testId]]],
              { fields: ['res_id', 'model'], limit: 1 }
            ]
          }
        }),
      })

      if (!response.ok) {
        continue
      }

      const data = await response.json()
      
      if (data.error) {
        continue
      }
      
      if (data.result && data.result.length > 0) {
        const record = data.result[0]
        // Vérifier que c'est bien un produit
        if (record.model === 'product.product' || record.model === 'product.template') {
          console.log(`[Odoo] Produit trouve avec ID: ${record.res_id} (format: ${testId})`)
          return record.res_id
        }
      }
    }
    
    console.warn(`[Odoo] WARNING: Produit ${externalId} introuvable dans Odoo`)
    return null
  } catch (error) {
    console.error(`[Odoo] ERREUR: Fallback recherche produit Odoo ${externalId}:`, error)
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
  console.log('[Odoo] Verification configuration Odoo...')
  
  // Vérifier la configuration Odoo
  const config: OdooConfig = {
    url: process.env.ODOO_URL || '',
    database: process.env.ODOO_DATABASE || '',
    username: process.env.ODOO_USERNAME || '',
    apiKey: process.env.ODOO_API_KEY || '',
  }

  console.log('[Odoo] Configuration Odoo:', {
    url: config.url ? 'DEFINI' : 'MANQUANT',
    database: config.database ? 'DEFINI' : 'MANQUANT',
    username: config.username ? 'DEFINI' : 'MANQUANT',
    apiKey: config.apiKey ? 'DEFINI (' + config.apiKey.substring(0, 10) + '...)' : 'MANQUANT',
  })

  if (!config.url || !config.database || !config.username || !config.apiKey) {
    console.warn('[Odoo] WARNING: Configuration Odoo incomplete, synchronisation ignoree')
    console.warn('[Odoo]   Variables manquantes:', {
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
      console.error('[Odoo] ERREUR: Impossible de s\'authentifier a Odoo')
      return null
    }

    // Récupérer les External IDs des produits
    const orderLines: Array<any> = []

    for (const { productId, item } of products) {
      // Récupérer l'External ID depuis la description du produit
      const product = await Product.findById(productId)
      if (!product || !product.description) {
        console.warn(`[Odoo] WARNING: Produit ${productId} sans External ID Odoo, ignore`)
        continue
      }

      const idMatch = product.description.match(/\[Odoo ID:\s*(.*?)\]/)
      if (!idMatch) {
        console.warn(`[Odoo] WARNING: Produit ${product.name} sans External ID Odoo, ignore`)
        continue
      }

      const externalId = idMatch[1].trim()
      
      // Rechercher le produit dans Odoo
      const odooProductId = await findProductByExternalId(config, uid, externalId)
      if (!odooProductId) {
        console.warn(`[Odoo] WARNING: Produit Odoo ${externalId} introuvable, ignore`)
        continue
      }

      orderLines.push([0, 0, {
        product_id: odooProductId,
        product_uom_qty: item.quantity,
        price_unit: item.price,
      }])
    }

    if (orderLines.length === 0) {
      console.warn('[Odoo] WARNING: Aucun produit valide pour Odoo, commande non creee')
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
      console.error(`[Odoo] ERREUR: HTTP ${response.status} lors de la creation commande Odoo`)
      return null
    }

    const data = await response.json()
    
    if (data.error) {
      console.error('[Odoo] ERREUR: Creation commande Odoo:', data.error)
      return null
    }

    const odooOrderId = data.result
    if (odooOrderId) {
      console.log(`[Odoo] SUCCESS: Commande Odoo creee avec ID: ${odooOrderId}`)
    } else {
      console.warn('[Odoo] WARNING: Commande Odoo creee mais ID non retourne')
    }
    return odooOrderId || null
  } catch (error) {
    console.error('[Odoo] ERREUR: Creation de la commande Odoo:', error)
    return null
  }
}

