# 📋 Variables d'environnement - Configuration complète

## ✅ Variables configurées sur Vercel

D'après votre configuration Vercel, voici toutes les variables d'environnement nécessaires :

### 🔐 Variables pour tous les environnements (All Environments)

#### MongoDB
```env
MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
```

#### Authentification JWT
```env
JWT_SECRET=faata_beach_jwt_secret_2025_chan...
```

### 🔄 Variables Odoo (Development, Preview, Production)

#### Configuration Odoo
```env
ODOO_URL=https://faata-beach.odoo.com
ODOO_DATABASE=faata-beach
ODOO_USERNAME=contact@faatabeach.com
ODOO_API_KEY=votre_api_key_odoo
```

**Note** : Ces variables doivent être configurées pour chaque environnement (Development, Preview, Production) sur Vercel.

## 📝 Fichier .env local

Pour le développement local, créez un fichier `.env` à la racine du projet avec :

```env
# MongoDB
MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority

# JWT
JWT_SECRET=faata_beach_jwt_secret_2025_changez_en_production

# Odoo
ODOO_URL=https://faata-beach.odoo.com
ODOO_DATABASE=faata-beach
ODOO_USERNAME=contact@faatabeach.com
ODOO_API_KEY=votre_api_key_odoo_ici

# VAPID (Notifications Push)
VAPID_PUBLIC_KEY=votre_cle_publique_vapid
VAPID_PRIVATE_KEY=votre_cle_privee_vapid
VITE_VAPID_PUBLIC_KEY=votre_cle_publique_vapid

# Frontend
VITE_API_URL=/api
```

## 🔍 Vérification sur Vercel

### Variables Odoo
Sur Vercel, vous devriez avoir :
- ✅ `ODOO_URL` pour Development, Preview, Production
- ✅ `ODOO_DATABASE` pour Development, Preview, Production
- ✅ `ODOO_USERNAME` pour Development, Preview, Production
- ✅ `ODOO_API_KEY` pour Development, Preview, Production

### Variables globales
- ✅ `MONGODB_URI` pour All Environments
- ✅ `JWT_SECRET` pour All Environments

## 📚 Documentation des variables

### MONGODB_URI
- **Description** : Connection string MongoDB Atlas
- **Format** : `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- **Environnements** : All Environments

### JWT_SECRET
- **Description** : Clé secrète pour signer les tokens JWT
- **Génération** : `openssl rand -base64 32`
- **Environnements** : All Environments
- ⚠️ **Important** : Changez cette valeur en production

### ODOO_URL
- **Description** : URL de votre instance Odoo
- **Format** : `https://faata-beach.odoo.com`
- **Environnements** : Development, Preview, Production

### ODOO_DATABASE
- **Description** : Nom de la base de données Odoo
- **Valeur** : `faata-beach`
- **Environnements** : Development, Preview, Production

### ODOO_USERNAME
- **Description** : Email de l'utilisateur API Odoo
- **Valeur** : `contact@faatabeach.com`
- **Environnements** : Development, Preview, Production

### ODOO_API_KEY
- **Description** : Clé API Odoo (ou mot de passe utilisateur)
- **Environnements** : Development, Preview, Production
- ⚠️ **Note** : Selon votre configuration Odoo, cela peut être la clé API ou le mot de passe

### VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
- **Description** : Clés VAPID pour les notifications push
- **Génération** : `npx web-push generate-vapid-keys`
- **Environnements** : All Environments (si utilisées)

### VITE_VAPID_PUBLIC_KEY
- **Description** : Clé publique VAPID exposée au frontend
- **Valeur** : Même valeur que `VAPID_PUBLIC_KEY`
- **Environnements** : All Environments (si utilisées)

### VITE_API_URL
- **Description** : URL de l'API utilisée par le frontend
- **Valeur** : `/api` (chemin relatif)
- **Environnements** : All Environments (si utilisée)

## ✅ Checklist de vérification

- [ ] `MONGODB_URI` configurée pour All Environments
- [ ] `JWT_SECRET` configurée pour All Environments
- [ ] `ODOO_URL` configurée pour Development, Preview, Production
- [ ] `ODOO_DATABASE` configurée pour Development, Preview, Production
- [ ] `ODOO_USERNAME` configurée pour Development, Preview, Production
- [ ] `ODOO_API_KEY` configurée pour Development, Preview, Production
- [ ] Fichier `.env` local créé (pour développement)
- [ ] Variables VAPID configurées (si vous utilisez les notifications push)

## 🔒 Sécurité

⚠️ **Important** :
- Le fichier `.env` est dans `.gitignore` - ne sera jamais commité
- Ne partagez jamais vos credentials publiquement
- Changez le `JWT_SECRET` en production avec une valeur aléatoire sécurisée
- Les variables d'environnement sur Vercel sont sécurisées et chiffrées

