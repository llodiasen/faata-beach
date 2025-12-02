import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

async function testOdooWithApiKey() {
  try {
    console.log('🔍 Test d\'authentification Odoo avec API Key\n')
    console.log('='.repeat(60))

    // Test 1 : Avec le mot de passe actuel
    console.log('📋 TEST 1 : Avec le mot de passe (@faatabeach2K25)')
    console.log('='.repeat(60))
    
    const configPassword: OdooConfig = {
      url: 'https://faata-beach.odoo.com',
      database: 'faata-beach',
      username: 'contact@faatabeach.com',
      apiKey: '@faatabeach2K25',
    }

    const response1 = await fetch(`${configPassword.url}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: configPassword.database,
          login: configPassword.username,
          password: configPassword.apiKey,
        },
      }),
    })

    const data1 = await response1.json()
    if (data1.error) {
      console.log('❌ Échec avec mot de passe')
      console.log('Erreur:', data1.error.message)
    } else {
      console.log('✅ Succès avec mot de passe')
      console.log(`UID: ${data1.result?.uid}`)
    }
    console.log('')

    // Test 2 : Avec l'API Key originale
    console.log('📋 TEST 2 : Avec l\'API Key originale (f69a536f18570ca07eea43722299d320e8a29240)')
    console.log('='.repeat(60))
    
    const configApiKey: OdooConfig = {
      url: 'https://faata-beach.odoo.com',
      database: 'faata-beach',
      username: 'contact@faatabeach.com',
      apiKey: 'f69a536f18570ca07eea43722299d320e8a29240',
    }

    const response2 = await fetch(`${configApiKey.url}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: configApiKey.database,
          login: configApiKey.username,
          password: configApiKey.apiKey,
        },
      }),
    })

    const data2 = await response2.json()
    if (data2.error) {
      console.log('❌ Échec avec API Key')
      console.log('Erreur:', data2.error.message)
    } else {
      console.log('✅ Succès avec API Key')
      console.log(`UID: ${data2.result?.uid}`)
    }
    console.log('')

    // Conclusion
    console.log('='.repeat(60))
    console.log('📊 CONCLUSION:')
    if (!data1.error && data2.error) {
      console.log('✅ Utilisez le MOT DE PASSE (@faatabeach2K25)')
      console.log('❌ L\'API Key originale ne fonctionne pas comme mot de passe')
    } else if (data1.error && !data2.error) {
      console.log('✅ Utilisez l\'API KEY (f69a536f18570ca07eea43722299d320e8a29240)')
      console.log('❌ Le mot de passe ne fonctionne pas')
    } else if (!data1.error && !data2.error) {
      console.log('✅ Les deux fonctionnent !')
      console.log('💡 Recommandation : Utilisez l\'API Key pour plus de sécurité')
    } else {
      console.log('❌ Aucune des deux méthodes ne fonctionne')
      console.log('💡 Vérifiez vos identifiants Odoo')
    }
    console.log('='.repeat(60))

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error)
    process.exit(1)
  }
}

testOdooWithApiKey()

