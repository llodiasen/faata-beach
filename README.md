# FAATA Beach - Application Web & PWA

Application web progressive (PWA) pour le restaurant FAATA Beach permettant aux clients de commander via QR Code ou NFC.

## 🚀 Technologies

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: Vercel Serverless Functions
- **Base de données**: MongoDB Atlas
- **State Management**: Zustand
- **UI Components**: Radix UI
- **PWA**: VitePWA Plugin

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Compte MongoDB Atlas
- Compte Vercel (pour le déploiement)

## 🛠️ Installation

1. **Cloner le projet**
```bash
cd faata-beach
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine :
```env
MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
JWT_SECRET=faata_beach_jwt_secret_2025_changez_en_production
VITE_API_URL=/api
VAPID_PUBLIC_KEY=<clé publique générée>
VAPID_PRIVATE_KEY=<clé privée générée>
VITE_VAPID_PUBLIC_KEY=<copiez la clé publique>
```

**Note** : Voir `CONFIG.md` pour la génération des clés VAPID et la configuration MongoDB.

4. **Lancer en développement**
```bash
npm run dev
```

## 📱 Fonctionnalités

- ✅ Page d'accueil avec sélection zone/table
- ✅ Navigation par modales pop-up
- ✅ Consultation des catégories et produits
- ✅ Panier avec gestion des quantités
- ✅ Commande (sur place ou emporter)
- ✅ Authentification utilisateur (optionnel)
- ✅ PWA installable sur mobile
- ✅ Mode offline (avec cache)
- ✅ Notifications push (promotions, statut commande)

## 🏗️ Structure du projet

```
faata-beach/
├── api/                    # Vercel Serverless Functions
│   ├── auth/              # Authentification
│   ├── categories/        # Catégories
│   ├── products/          # Produits
│   ├── orders/            # Commandes
│   └── lib/               # Utilitaires (MongoDB, auth)
├── src/
│   ├── components/        # Composants React
│   │   ├── modals/        # Modales pop-up
│   │   ├── auth/          # Authentification
│   │   ├── layout/        # Header, Hero
│   │   └── ui/            # Composants UI réutilisables
│   ├── pages/             # Pages
│   ├── store/             # Stores Zustand
│   ├── lib/               # Client API
│   └── hooks/             # Hooks React
└── public/                # Assets statiques
```

## 🚀 Déploiement sur Vercel

1. **Connecter le projet à Vercel**
```bash
npm i -g vercel
vercel
```

2. **Configurer les variables d'environnement dans Vercel**
   - Allez dans Settings > Environment Variables
   - Ajoutez `MONGODB_URI`, `JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VITE_VAPID_PUBLIC_KEY`

3. **Déployer**
```bash
vercel --prod
```

## 📦 Base de données MongoDB

Les collections suivantes seront créées automatiquement :
- `users` - Utilisateurs
- `categories` - Catégories de produits
- `products` - Produits
- `orders` - Commandes
- `pushsubscriptions` - Abonnements aux notifications push

### Exemple de données

**Catégorie**:
```json
{
  "name": "Plats principaux",
  "description": "Nos spécialités",
  "isActive": true,
  "displayOrder": 1
}
```

**Produit**:
```json
{
  "categoryId": "category_id",
  "name": "Poulet grillé",
  "description": "Poulet mariné et grillé",
  "price": 15.99,
  "isAvailable": true
}
```

## 🎨 Personnalisation

### Couleurs
Modifier `tailwind.config.js` pour changer les couleurs :
```js
colors: {
  'faata-red': '#DC2626', // Couleur principale
}
```

### Images
Ajouter les images dans `public/images/` :
- `hero-beach-food.jpg` - Image de fond de la page d'accueil
- Icônes PWA dans `public/icons/`

## 📱 PWA

L'application est configurée comme PWA :
- Installable sur mobile et desktop
- Fonctionne hors ligne (avec cache)
- Service Worker automatique via VitePWA

Pour tester l'installation :
1. Ouvrir l'application dans Chrome/Edge
2. Cliquer sur l'icône d'installation dans la barre d'adresse
3. Ou utiliser le menu > "Installer l'application"

## 🔐 Authentification

L'authentification est optionnelle :
- Les clients peuvent commander sans compte (mode invité)
- Les clients connectés peuvent :
  - Voir leur historique de commandes
  - Sauvegarder leurs informations
  - Réserver une table

## 📝 Scripts disponibles

- `npm run dev` - Lancer en développement
- `npm run build` - Build de production
- `npm run preview` - Prévisualiser le build

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifier que `MONGODB_URI` est correct
- Vérifier que l'IP est autorisée dans MongoDB Atlas

### Les modales ne s'ouvrent pas
- Vérifier que Radix UI est bien installé
- Vérifier la console pour les erreurs

### PWA ne s'installe pas
- Vérifier que l'application est servie en HTTPS (ou localhost)
- Vérifier que le manifest.json est valide

## 📄 Licence

MIT

