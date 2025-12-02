import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
const envPath = join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

console.log('🔍 Vérification des Variables d\'Environnement Odoo\n')
console.log('='.repeat(60))
console.log('📋 VARIABLES LOCALES (.env):')
console.log('='.repeat(60))

const variables = {
  'ODOO_URL': process.env.ODOO_URL,
  'ODOO_DATABASE': process.env.ODOO_DATABASE,
  'ODOO_USERNAME': process.env.ODOO_USERNAME,
  'ODOO_API_KEY': process.env.ODOO_API_KEY,
}

let allPresent = true

for (const [key, value] of Object.entries(variables)) {
  if (value) {
    const displayValue = key === 'ODOO_API_KEY' 
      ? value.substring(0, 15) + '...' 
      : value
    console.log(`✅ ${key}: ${displayValue}`)
  } else {
    console.log(`❌ ${key}: MANQUANT`)
    allPresent = false
  }
}

console.log('')
console.log('='.repeat(60))
console.log('📋 CONFIGURATION VERCEL (d\'après vos captures):')
console.log('='.repeat(60))
console.log('✅ ODOO_URL: https://faata-beach.odoo.com')
console.log('✅ ODOO_DATABASE: faata-beach')
console.log('✅ ODOO_USERNAME: contact@faatabeach.com')
console.log('✅ ODOO_API_KEY: @faatabeach2K25')
console.log('')
console.log('✅ Toutes les variables sont configurées dans Vercel!')
console.log('')

if (!allPresent) {
  console.log('⚠️  ATTENTION: Certaines variables manquent dans le .env local')
  console.log('   Mais cela n\'affecte pas la production (Vercel utilise ses propres variables)')
  console.log('')
}

console.log('='.repeat(60))
console.log('💡 PROCHAINES ÉTAPES:')
console.log('='.repeat(60))
console.log('1. ✅ Vérifiez que le redéploiement Vercel est terminé')
console.log('2. ✅ Passez une nouvelle commande test')
console.log('3. ✅ Vérifiez les logs Vercel (Functions → /api/orders)')
console.log('4. ✅ Vous devriez maintenant voir des logs détaillés:')
console.log('   - 🔄 Tentative de synchronisation Odoo...')
console.log('   - 📋 Configuration Odoo: ...')
console.log('   - ✅ ou ❌ selon le résultat')
console.log('='.repeat(60))

