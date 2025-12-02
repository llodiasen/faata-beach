# 🔄 Comment Redéployer sur Vercel

## Méthode 1 : Redéploiement Manuel (Recommandé après modification des variables)

1. **Allez sur** https://vercel.com
2. **Sélectionnez** votre projet `faata-beach`
3. **Allez dans** "Deployments"
4. **Trouvez** le dernier déploiement (en haut de la liste)
5. **Cliquez sur** les "..." (3 points) à droite du déploiement
6. **Sélectionnez** "Redeploy"
7. **Confirmez** le redéploiement
8. **Attendez** 2-3 minutes que le déploiement se termine

## Méthode 2 : Forcer un Nouveau Déploiement via Git

Si vous préférez forcer un nouveau déploiement via Git :

```bash
# Créer un commit vide pour forcer un redéploiement
git commit --allow-empty -m "Trigger: Redéploiement après mise à jour variables Odoo"
git push origin main
```

Vercel détectera automatiquement le nouveau commit et redéploiera.

## ⚠️ Important

**Après avoir modifié les variables d'environnement dans Vercel, vous DEVEZ redéployer** car :
- Les changements de variables ne déclenchent pas automatiquement un redéploiement
- Le redéploiement est nécessaire pour que les nouvelles variables soient prises en compte

## ✅ Vérification du Redéploiement

1. **Vercel** → **Deployments**
2. Le dernier déploiement devrait être :
   - **En cours** : "Building" ou "Queued"
   - **Terminé** : "Ready" (vert) avec un horodatage récent

Une fois "Ready", les nouvelles variables sont actives !

