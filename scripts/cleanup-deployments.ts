import { execSync } from 'child_process'

interface Deployment {
  url: string
  age: string
  status: string
  environment: string
}

async function cleanupDeployments() {
  try {
    console.log('🔍 Récupération de la liste des déploiements...\n')
    
    // Exécuter vercel ls et récupérer la sortie
    const output = execSync('vercel ls', { encoding: 'utf-8' })
    
    // Parser les lignes (ignorer les 2 premières lignes d'en-tête)
    const lines = output.split('\n').filter(line => line.trim())
    
    // Ignorer les lignes d'en-tête et de commandes
    const deploymentLines = lines.slice(2).filter(line => {
      // Ignorer les lignes qui contiennent "Common next commands" ou sont vides
      return line.trim() && 
             !line.includes('Common next commands') && 
             !line.includes('Age') &&
             !line.includes('Deployment') &&
             line.includes('vercel.app')
    })
    
    if (deploymentLines.length === 0) {
      console.log('⚠️  Aucun déploiement trouvé')
      return
    }
    
    console.log(`📊 Total de déploiements trouvés: ${deploymentLines.length}\n`)
    
    // Parser chaque ligne pour extraire l'URL (les déploiements sont déjà triés du plus récent au plus ancien)
    const deployments: string[] = []
    
    for (const line of deploymentLines) {
      // L'URL est généralement la partie qui contient "vercel.app"
      const urlMatch = line.match(/https:\/\/[^\s]+vercel\.app/)
      if (urlMatch) {
        deployments.push(urlMatch[0])
      }
    }
    
    // Les déploiements sont déjà dans l'ordre du plus récent au plus ancien
    // Le premier est le plus récent
    
    if (deployments.length === 0) {
      console.log('⚠️  Aucune URL de déploiement trouvée')
      return
    }
    
    // Garder les 2 derniers déploiements (les 2 premiers de la liste)
    const toKeep = deployments.slice(0, 2)
    const toDelete = deployments.slice(2)
    
    console.log('✅ Déploiements à CONSERVER (les 2 plus récents):')
    toKeep.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`)
    })
    
    console.log(`\n🗑️  Déploiements à SUPPRIMER (${toDelete.length}):`)
    toDelete.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`)
    })
    
    if (toDelete.length === 0) {
      console.log('\n✨ Aucun déploiement à supprimer. Vous avez déjà seulement 2 déploiements ou moins.')
      return
    }
    
    console.log(`\n⚠️  Vous êtes sur le point de supprimer ${toDelete.length} déploiement(s).`)
    console.log('   Cette action est irréversible.\n')
    
    // Supprimer chaque déploiement
    let successCount = 0
    let errorCount = 0
    
    for (const url of toDelete) {
      try {
        console.log(`🗑️  Suppression de: ${url}...`)
        execSync(`vercel rm ${url} --yes`, { encoding: 'utf-8', stdio: 'pipe' })
        console.log(`   ✅ Supprimé avec succès\n`)
        successCount++
      } catch (error: any) {
        console.log(`   ❌ Erreur: ${error.message}\n`)
        errorCount++
      }
    }
    
    console.log('\n📊 Résumé:')
    console.log(`   ✅ Supprimés: ${successCount}`)
    console.log(`   ❌ Erreurs: ${errorCount}`)
    console.log(`   📝 Conservés: ${toKeep.length}`)
    console.log('\n✨ Nettoyage terminé!')
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

cleanupDeployments()

