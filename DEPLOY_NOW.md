# 🚀 Déploiement Rapide sur Vercel - FAATA Beach

## ✅ Checklist avant déploiement

- [x] Configuration `vercel.json` présente
- [x] Routes API dans le dossier `api/`
- [x] Build command configuré (`npm run build`)
- [x] Variables d'environnement prêtes

## 🎯 Déploiement en 3 étapes

### Étape 1 : Préparer Git (si pas déjà fait)

```bash
git add .
git commit -m "Prêt pour déploiement Vercel"
git push origin main
```

### Étape 2 : Déployer via Vercel Dashboard

1. **Aller sur [vercel.com](https://vercel.com)** et se connecter
2. **Cliquer sur "Add New Project"**
3. **Importer votre repository GitHub**
4. **Configurer le projet** :
   - Framework Preset : **Vite**
   - Root Directory : `./`
   - Build Command : `npm run build`
   - Output Directory : `dist`
   - Install Command : `npm install`

### Étape 3 : Ajouter les variables d'environnement

Dans **Settings → Environment Variables**, ajoutez :

```
MONGODB_URI = mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
JWT_SECRET = faata_beach_jwt_secret_2025_changez_en_production
```

**⚠️ Important** : Cochez **Production**, **Preview**, et **Development** pour chaque variable.

### Étape 4 : Déployer

Cliquez sur **"Deploy"** et attendez 2-3 minutes.

🎉 **Votre site sera en ligne à** : `https://votre-projet.vercel.app`

---

## 🔧 Déploiement via CLI (Alternative)

Si vous préférez utiliser la ligne de commande :

```bash
# 1. Installer Vercel CLI (si pas déjà fait)
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel

# 4. Ajouter les variables d'environnement
vercel env add MONGODB_URI
# Collez la valeur et sélectionnez Production, Preview, Development

vercel env add JWT_SECRET
# Collez la valeur et sélectionnez Production, Preview, Development

# 5. Déployer en production
vercel --prod
```

---

## ✅ Vérifications après déploiement

1. **Tester l'application** :
   - Ouvrir l'URL de déploiement
   - Vérifier que la page d'accueil se charge
   - Vérifier que les catégories s'affichent
   - Vérifier que les produits s'affichent

2. **Tester les API** :
   - Ouvrir la console développeur (F12)
   - Vérifier qu'il n'y a pas d'erreurs 404 ou 500
   - Tester une commande complète

3. **Vérifier les logs** :
   - Dashboard Vercel → Deployments → Votre déploiement
   - Cliquer sur "Functions" pour voir les logs API
   - Cliquer sur "Logs" pour voir les erreurs

---

## 🐛 Problèmes courants

### Erreur : "Module not found"
**Solution** : Vérifier que toutes les dépendances sont dans `package.json`

### Erreur : "Environment variable not found"
**Solution** : Vérifier que les variables sont ajoutées dans Vercel Dashboard et redéployer

### Erreur : "404 Not Found" sur les API
**Solution** : Vérifier que `vercel.json` est présent et que les routes API exportent `default`

### Erreur : "MongoDB connection failed"
**Solution** : 
1. Vérifier `MONGODB_URI` dans Vercel
2. MongoDB Atlas → Network Access → Ajouter `0.0.0.0/0`

---

## 📝 Notes importantes

- Les déploiements sont automatiques à chaque push sur `main`
- Les autres branches créent des previews automatiques
- Les variables d'environnement doivent être ajoutées pour chaque environnement (Production, Preview, Development)

---

## 🎉 C'est tout !

Votre application est maintenant en ligne sur Vercel !

