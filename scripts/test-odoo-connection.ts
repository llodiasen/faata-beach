import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
const envPath = join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

interface OdooConfig {
  url: string
  database: string
  username: string
  apiKey: string
}

async function testOdooConnection() {
  try {
    console.log('🔍 Test de connexion Odoo\n')
    console.log('='.repeat(60))

    // Vérifier la configuration
    const config: OdooConfig = {
      url: process.env.ODOO_URL || '',
      database: process.env.ODOO_DATABASE || '',
      username: process.env.ODOO_USERNAME || '',
      apiKey: process.env.ODOO_API_KEY || '',
    }

    console.log('📋 CONFIGURATION ODOO:')
    console.log('='.repeat(60))
    console.log(`URL: ${config.url || '❌ NON DÉFINI'}`)
    console.log(`Database: ${config.database || '❌ NON DÉFINI'}`)
    console.log(`Username: ${config.username || '❌ NON DÉFINI'}`)
    console.log(`API Key: ${config.apiKey ? '✅ DÉFINI (' + config.apiKey.substring(0, 10) + '...)' : '❌ NON DÉFINI'}`)
    console.log('')

    if (!config.url || !config.database || !config.username || !config.apiKey) {
      console.log('❌ CONFIGURATION INCOMPLÈTE!')
      console.log('')
      console.log('💡 Pour corriger:')
      console.log('   1. Vérifiez votre fichier .env local')
      console.log('   2. Vérifiez les variables d\'environnement dans Vercel:')
      console.log('      - Settings → Environment Variables')
      console.log('      - Ajoutez: ODOO_URL, ODOO_DATABASE, ODOO_USERNAME, ODOO_API_KEY')
      console.log('')
      process.exit(1)
    }

    console.log('🔄 Test d\'authentification Odoo...')
    console.log('')

    // Test d'authentification
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
      console.error(`❌ Erreur HTTP ${response.status} lors de l'authentification`)
      const text = await response.text()
      console.error(`Réponse: ${text.substring(0, 200)}`)
      process.exit(1)
    }

    const data = await response.json()
    
    if (data.error) {
      console.error('❌ Erreur authentification Odoo:')
      console.error(JSON.stringify(data.error, null, 2))
      process.exit(1)
    }

    const uid = data.result?.uid
    if (!uid) {
      console.error('❌ Aucun UID retourné par Odoo')
      console.error('Réponse complète:', JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('✅ Authentification réussie!')
    console.log(`   UID: ${uid}`)
    console.log('')

    // Test de recherche d'un produit
    console.log('🔄 Test de recherche d\'un produit Odoo...')
    console.log('   (Recherche: product_template_salade_ni_oise_1)')
    console.log('')

    const searchResponse = await fetch(`${config.url}/jsonrpc`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
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
            [[['name', '=', 'product_template_salade_ni_oise_1']]],
            { fields: ['res_id', 'module', 'name', 'model'], limit: 1 }
          ]
        }
      }),
    })

    if (!searchResponse.ok) {
      console.error(`❌ Erreur HTTP ${searchResponse.status} lors de la recherche`)
      process.exit(1)
    }

    const searchData = await searchResponse.json()
    
    if (searchData.error) {
      console.error('❌ Erreur recherche produit:')
      console.error(JSON.stringify(searchData.error, null, 2))
      process.exit(1)
    }

    if (searchData.result && searchData.result.length > 0) {
      console.log('✅ Produit trouvé dans Odoo!')
      console.log(`   ID: ${searchData.result[0].res_id}`)
    } else {
      console.log('⚠️  Produit non trouvé dans Odoo')
      console.log('   (Vérifiez que les produits ont bien été importés)')
    }

    console.log('')
    console.log('='.repeat(60))
    console.log('✅ TOUS LES TESTS SONT PASSÉS!')
    console.log('✅ La synchronisation devrait fonctionner correctement.')
    console.log('='.repeat(60))

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      if (error.message.includes('fetch')) {
        console.error('\n💡 Vérifiez que:')
        console.error('   1. L\'URL Odoo est correcte et accessible')
        console.error('   2. Vous êtes connecté à Internet')
        console.error('   3. Odoo n\'est pas en maintenance')
      }
    }
    process.exit(1)
  }
}

testOdooConnection()

