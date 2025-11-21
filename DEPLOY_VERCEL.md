# 🚀 Guide de déploiement sur Vercel - FAATA Beach

Guide complet pour déployer votre application FAATA Beach sur Vercel.

## 📋 Prérequis

1. **Compte Vercel** (gratuit) : [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket** : Pour connecter votre repository
3. **Variables d'environnement** : MONGODB_URI et JWT_SECRET

---

## 🎯 Méthode 1 : Déploiement via le Dashboard Vercel (Recommandé)

### Étape 1 : Préparer votre repository Git

1. **Initialiser Git** (si pas déjà fait) :
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Créer un repository sur GitHub/GitLab/Bitbucket** :
   - Créez un nouveau repository
   - Suivez les instructions pour push votre code :
```bash
git remote add origin https://github.com/VOTRE_USERNAME/faata-beach.git
git branch -M main
git push -u origin main
```

### Étape 2 : Connecter le projet à Vercel

1. **Aller sur [vercel.com](https://vercel.com)** et se connecter
2. **Cliquer sur "Add New Project"**
3. **Importer le repository** :
   - Sélectionnez votre repository GitHub/GitLab/Bitbucket
   - Cliquez sur "Import"

### Étape 3 : Configurer le projet

Vercel détectera automatiquement :
- **Framework Preset** : Vite
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

**⚠️ Modifications importantes :**

1. **Build Command** : Gardez `npm run build`
2. **Output Directory** : `dist`
3. **Install Command** : `npm install` (par défaut)

### Étape 4 : Ajouter les variables d'environnement

1. Dans la page de configuration, allez à **"Environment Variables"**
2. **Ajoutez ces variables** :

```
MONGODB_URI = mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
JWT_SECRET = faata_beach_jwt_secret_2025_changez_en_production
```

**⚠️ Important :**
- Cochez **"Production"**, **"Preview"**, et **"Development"** pour chaque variable
- Ne jamais commiter le fichier `.env` dans Git !

### Étape 5 : Déployer

1. **Cliquez sur "Deploy"**
2. Vercel va :
   - Installer les dépendances
   - Builder votre application
   - Déployer automatiquement

3. **Attendre la fin du déploiement** (2-3 minutes)

4. **Votre site est en ligne !** 🎉
   - URL : `https://votre-projet.vercel.app`

---

## 🎯 Méthode 2 : Déploiement via CLI Vercel

### Étape 1 : Installer Vercel CLI

```bash
npm install -g vercel
```

### Étape 2 : Se connecter à Vercel

```bash
vercel login
```

### Étape 3 : Déployer

Depuis la racine du projet :

```bash
vercel
```

**Premier déploiement** :
- Vercel posera des questions :
  - ✅ Set up and deploy? **Yes**
  - ✅ Which scope? (Sélectionnez votre compte)
  - ✅ Link to existing project? **No** (première fois)
  - ✅ Project name? **faata-beach** (ou le nom de votre choix)
  - ✅ Directory? **./** (par défaut)
  - ✅ Override settings? **No** (par défaut)

### Étape 4 : Ajouter les variables d'environnement

```bash
vercel env add MONGODB_URI
# Collez votre MONGODB_URI et sélectionnez Production, Preview, Development

vercel env add JWT_SECRET
# Collez votre JWT_SECRET et sélectionnez Production, Preview, Development
```

### Étape 5 : Déployer en production

```bash
vercel --prod
```

---

## 🔧 Configuration du fichier `vercel.json`

Votre fichier `vercel.json` est déjà configuré :

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

Cette configuration permet à Vercel de :
- Servir votre frontend React
- Router les requêtes `/api/*` vers vos Serverless Functions dans le dossier `api/`

---

## ✅ Vérifications après déploiement

### 1. Tester votre application

1. Ouvrez l'URL de déploiement : `https://votre-projet.vercel.app`
2. Vérifiez que :
   - ✅ La page d'accueil se charge
   - ✅ Les API fonctionnent (ouvrez la console développeur)
   - ✅ Les catégories se chargent
   - ✅ Les produits s'affichent

### 2. Vérifier les logs

1. **Dashboard Vercel** → **Deployments** → Sélectionnez votre déploiement
2. **Cliquez sur "Functions"** pour voir les logs des API
3. **Cliquez sur "Logs"** pour voir les erreurs éventuelles

### 3. Tester les API directement

```bash
# Tester l'API des catégories
curl https://votre-projet.vercel.app/api/categories

# Devrait retourner la liste des catégories
```

---

## 🔄 Déploiements automatiques

Avec Vercel, chaque push sur votre repository déclenche un nouveau déploiement :

### Branche `main` → Production
```bash
git push origin main
# Déploie automatiquement en production
```

### Autres branches → Preview
```bash
git checkout -b feature/nouvelle-fonctionnalite
git push origin feature/nouvelle-fonctionnalite
# Crée automatiquement une URL de preview
```

---

## 🐛 Résolution de problèmes

### Erreur : "Module not found"

**Problème** : Les dépendances ne sont pas installées correctement

**Solution** :
1. Vérifiez que `package.json` contient toutes les dépendances
2. Dans Vercel Dashboard → Settings → Build & Development Settings
3. Vérifiez que **"Install Command"** est : `npm install`

### Erreur : "Environment variable not found"

**Problème** : Les variables d'environnement ne sont pas configurées

**Solution** :
1. Vercel Dashboard → Settings → Environment Variables
2. Vérifiez que toutes les variables sont ajoutées
3. Vérifiez que vous avez coché **Production**, **Preview**, et **Development**
4. Redéployez après avoir ajouté les variables

### Erreur : "404 Not Found" sur les API

**Problème** : Les routes API ne sont pas correctement configurées

**Solution** :
1. Vérifiez que `vercel.json` existe et contient les rewrites
2. Vérifiez que le dossier `api/` est bien à la racine
3. Vérifiez la structure des fichiers API (doivent exporter `default`)

### Erreur : "MongoDB connection failed"

**Problème** : MONGODB_URI incorrect ou MongoDB Atlas bloque les connexions

**Solution** :
1. Vérifiez que `MONGODB_URI` est correct dans Vercel
2. MongoDB Atlas → Network Access → Ajoutez `0.0.0.0/0` (autoriser toutes les IPs)
3. Ou ajoutez l'IP de Vercel spécifiquement

---

## 📱 Configuration PWA

Votre application est déjà configurée comme PWA :

1. **Manifest** : `public/manifest.json`
2. **Service Worker** : Généré automatiquement par VitePWA
3. **Icons** : Ajoutez les icônes dans `public/icons/`
   - `icon-192x192.png`
   - `icon-512x512.png`

---

## 🔐 Sécurité

### Variables d'environnement sensibles

**⚠️ Ne jamais commiter** :
- `.env` (déjà dans `.gitignore`)
- Variables avec mots de passe ou secrets

**✅ Utiliser** :
- Variables d'environnement Vercel
- Secrets Vercel pour les données très sensibles

---

## 📊 Monitoring

Vercel fournit :
- **Analytics** : Nombre de visiteurs, performance
- **Speed Insights** : Vitesse de chargement
- **Logs** : Erreurs et logs des fonctions serverless

**Activer** :
1. Dashboard Vercel → Project → Settings
2. Activez "Analytics" et "Speed Insights"

---

## 🎉 C'est terminé !

Votre application FAATA Beach est maintenant en ligne sur Vercel !

**URL de production** : `https://votre-projet.vercel.app`

**Prochaines étapes** :
- ✅ Tester toutes les fonctionnalités
- ✅ Configurer un domaine personnalisé (optionnel)
- ✅ Ajouter les icônes PWA
- ✅ Configurer les analytics

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les logs dans Vercel Dashboard
2. Vérifiez la [documentation Vercel](https://vercel.com/docs)
3. Vérifiez que toutes les variables d'environnement sont configurées

