# Guide de déploiement - FAATA Beach

## Préparation

### 1. MongoDB Atlas

1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster gratuit (M0)
3. Créer un utilisateur avec mot de passe
4. Autoriser l'accès depuis n'importe quelle IP (0.0.0.0/0) pour le développement
5. Récupérer la connection string :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/faata-beach?retryWrites=true&w=majority
   ```

### 2. Vercel

1. Créer un compte sur [Vercel](https://vercel.com)
2. Installer Vercel CLI :
   ```bash
   npm i -g vercel
   ```

## Déploiement

### Option 1 : Via Vercel CLI

1. **Se connecter à Vercel**
   ```bash
   vercel login
   ```

2. **Initialiser le projet**
   ```bash
   cd faata-beach
   vercel
   ```
   - Suivre les instructions
   - Ne pas override les settings par défaut

3. **Configurer les variables d'environnement**
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   ```
   - Entrer les valeurs pour chaque variable
   - Sélectionner "Production, Preview, and Development"

4. **Déployer en production**
   ```bash
   vercel --prod
   ```

### Option 2 : Via GitHub (recommandé)

1. **Créer un repository GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/votre-username/faata-beach.git
   git push -u origin main
   ```

2. **Connecter à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "New Project"
   - Importer le repository GitHub
   - Configurer :
     - Framework Preset: Vite
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Ajouter les variables d'environnement**
   - Dans les settings du projet Vercel
   - Aller dans "Environment Variables"
   - Ajouter :
     - `MONGODB_URI` = votre connection string MongoDB
     - `JWT_SECRET` = un secret aléatoire sécurisé

4. **Déployer**
   - Vercel déploiera automatiquement à chaque push sur main

## Configuration post-déploiement

### 1. MongoDB Atlas - Network Access

Après le déploiement, Vercel utilise des IPs dynamiques. Pour la production :
- Dans MongoDB Atlas, aller dans "Network Access"
- Ajouter `0.0.0.0/0` (toutes les IPs) OU
- Utiliser Vercel IP ranges (plus sécurisé mais nécessite une mise à jour régulière)

### 2. Vérifier le déploiement

1. Ouvrir l'URL fournie par Vercel
2. Tester :
   - Page d'accueil s'affiche
   - Les modales s'ouvrent
   - Les appels API fonctionnent (vérifier la console)

### 3. Ajouter des données de test

Utiliser MongoDB Compass ou l'interface web MongoDB Atlas pour ajouter :
- Des catégories
- Des produits
- (Optionnel) Un utilisateur admin

## Variables d'environnement

### Production (Vercel)
- `MONGODB_URI` - Connection string MongoDB
- `JWT_SECRET` - Secret pour signer les tokens JWT

### Développement local
Créer un fichier `.env` :
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=votre_secret
VITE_API_URL=/api
```

## Domaines personnalisés

1. Dans Vercel, aller dans "Settings" > "Domains"
2. Ajouter votre domaine
3. Suivre les instructions DNS
4. Vercel configurera automatiquement HTTPS

## Monitoring

- Vercel fournit des logs automatiques
- Vérifier les logs dans le dashboard Vercel
- Pour MongoDB, utiliser MongoDB Atlas monitoring

## Rollback

Si un déploiement pose problème :
1. Aller dans "Deployments" dans Vercel
2. Trouver le dernier déploiement fonctionnel
3. Cliquer sur "..." > "Promote to Production"

## Support

- Documentation Vercel : https://vercel.com/docs
- Documentation MongoDB Atlas : https://docs.atlas.mongodb.com

