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
const { Product } = await import('../api/lib/models.js')

// Liste des IDs Odoo uploadés (depuis votre liste)
const odooIdsFromList = [
  'product_template_salade_ni_oise_1',
  'product_template_brochettes_de_lotte_2',
  'product_template_le_du_saloum_3',
  'product_template_crevettes_saut_es_l_ail_4',
  'product_template_pizza_reine_5',
  'product_template_brochettes_de_poulet_6',
  'product_template_steak_grill_7',
  'product_template_banane_flamb_e_8',
  'product_template_riz_pilaf_9',
  'product_template_teranga_10',
  'product_template_salade_du_chef_11',
  'product_template_poisson_brais_12',
  'product_template_gambas_grill_es_13',
  'product_template_poulet_grill_14',
  'product_template_minc_de_b_uf_15',
  'product_template_riz_blanc_16',
  'product_template_salade_de_fruits_17',
  'product_template_pizza_oriental_18',
  'product_template_frites_19',
  'product_template_beach_cumber_20',
  'product_template_cocktail_d_avocat_aux_crevettes_21',
  'product_template_brochettes_mixtes_22',
  'product_template_fruits_de_saison_23',
  'product_template_poulet_pan_24',
  'product_template_pizza_au_fruit_de_mer_25',
  'product_template_filet_lotte_pan_26',
  'product_template_l_gumes_saut_s_27',
  'product_template_salade_italienne_28',
  'product_template_virgil_mojito_29',
  'product_template_pizza_au_fromage_30',
  'product_template_sole_meuni_re_31',
  'product_template_cr_pe_au_chocolat_32',
  'product_template_cordon_bleu_33',
  'product_template_rago_t_de_b_uf_34',
  'product_template_sole_colbert_35',
  'product_template_cr_pe_base_de_fruits_36',
  'product_template_salade_exotique_37',
  'product_template_pommes_de_terre_saut_es_38',
  'product_template_pizza_viande_hach_e_39',
  'product_template_virgil_colada_40',
  'product_template_spaghetti_41',
  'product_template_salade_chinoise_42',
  'product_template_fra_cheur_des_les_43',
  'product_template_uf_mimosa_44',
  'product_template_gratin_dauphinois_45',
  'product_template_touraco_basilic_46',
  'product_template_salade_d_avocat_47',
  'product_template_lac_rose_48',
  'product_template_cocktail_de_crevette_49',
  'product_template_bloody_mary_50',
  'product_template_choux_l_anglaise_51',
  'product_template_mojito_52',
  'product_template_ti_punch_53',
  'product_template_salade_de_fruit_de_mer_54',
  'product_template_tomate_mozzarella_55',
  'product_template_pi_a_colada_56',
  'product_template_calamar_frite_57',
  'product_template_moscow_mule_58',
  'product_template_cocktail_de_crevette_aux_agrumes_59',
  'product_template_nik_fizz_60',
  'product_template_americano_61',
  'product_template_beignets_de_crevettes_62',
  'product_template_margarita_63',
  'product_template_soupe_de_l_gumes_64',
  'product_template_soupe_de_poisson_65',
  'product_template_tom_collins_66',
  'product_template_negroni_67',
  'product_template_yummy_mosa_68',
  'product_template_bissap_69',
  'product_template_bouye_70',
  'product_template_gingembre_71',
  'product_template_orange_press_e_72',
  'product_template_coca_normal_73',
  'product_template_coca_z_ro_74',
  'product_template_fanta_75',
  'product_template_sprite_76',
  'product_template_tonic_77',
  'product_template_gazelle_78',
  'product_template_flag_79',
  'product_template_coco_ananas_80',
  'product_template_orange_81',
  'product_template_ananas_82',
  'product_template_cocktail_83',
  'product_template_goyave_84',
  'product_template_caf_85',
  'product_template_th_86',
]

async function verifyOdooIds() {
  try {
    console.log('🔍 Vérification des IDs Odoo dans MongoDB\n')
    console.log('='.repeat(60))

    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB\n')

    // Récupérer tous les produits
    console.log('📦 Récupération des produits...')
    const products = await Product.find({ isAvailable: true })
      .sort({ displayOrder: 1 })
      .exec()
    
    console.log(`✅ ${products.length} produit(s) trouvé(s)\n`)

    if (products.length === 0) {
      console.log('⚠️  Aucun produit à vérifier!')
      await mongoose.disconnect()
      process.exit(0)
    }

    // Vérifier chaque produit
    let productsWithId = 0
    let productsWithoutId = 0
    const productsMissingIds: Array<{ name: string; _id: string }> = []
    const productsWithWrongId: Array<{ name: string; currentId: string | null; expectedId?: string }> = []

    for (const product of products) {
      if (!product.description) {
        productsWithoutId++
        productsMissingIds.push({ name: product.name, _id: product._id.toString() })
        continue
      }

      const idMatch = product.description.match(/\[Odoo ID:\s*(.*?)\]/)
      if (!idMatch) {
        productsWithoutId++
        productsMissingIds.push({ name: product.name, _id: product._id.toString() })
        continue
      }

      const odooId = idMatch[1].trim()
      
      // Vérifier si l'ID est dans la liste uploadée
      if (odooIdsFromList.includes(odooId)) {
        productsWithId++
      } else {
        productsWithWrongId.push({ 
          name: product.name, 
          currentId: odooId,
        })
      }
    }

    // Afficher le rapport
    console.log('='.repeat(60))
    console.log('📊 RAPPORT DE VÉRIFICATION')
    console.log('='.repeat(60))
    console.log(`\n✅ Produits avec ID Odoo valide : ${productsWithId}/${products.length}`)
    console.log(`❌ Produits sans ID Odoo : ${productsWithoutId}`)
    console.log(`⚠️  Produits avec ID Odoo non reconnu : ${productsWithWrongId.length}`)
    console.log('')

    if (productsMissingIds.length > 0) {
      console.log('❌ PRODUITS SANS ID ODOO:')
      productsMissingIds.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p._id})`)
      })
      console.log('')
    }

    if (productsWithWrongId.length > 0) {
      console.log('⚠️  PRODUITS AVEC ID ODOO NON RECONNU:')
      productsWithWrongId.forEach(p => {
        console.log(`   - ${p.name}`)
        console.log(`     ID actuel: ${p.currentId}`)
      })
      console.log('')
    }

    // Vérifier les IDs de la liste qui ne sont pas dans MongoDB
    const foundIds = new Set<string>()
    products.forEach(product => {
      if (product.description) {
        const idMatch = product.description.match(/\[Odoo ID:\s*(.*?)\]/)
        if (idMatch) {
          foundIds.add(idMatch[1].trim())
        }
      }
    })

    const missingInMongo = odooIdsFromList.filter(id => !foundIds.has(id))
    if (missingInMongo.length > 0) {
      console.log('⚠️  IDs ODOO DE LA LISTE NON TROUVÉS DANS MONGODB:')
      missingInMongo.forEach(id => {
        console.log(`   - ${id}`)
      })
      console.log('')
    }

    // Résumé final
    console.log('='.repeat(60))
    if (productsWithId === products.length && missingInMongo.length === 0) {
      console.log('✅ TOUS LES PRODUITS ONT UN ID ODOO VALIDE!')
      console.log('✅ La synchronisation devrait fonctionner correctement.')
    } else {
      console.log('⚠️  CERTAINS PRODUITS N\'ONT PAS D\'ID ODOO')
      console.log('💡 Exécutez: npm run export-to-odoo pour mettre à jour les produits')
    }
    console.log('='.repeat(60))

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

verifyOdooIds()

