# Configuration MongoDB

## Connection String

Votre connection string MongoDB Atlas est configurée :

```
mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
```

## Configuration

### 1. Créer le fichier .env

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
JWT_SECRET=faata_beach_jwt_secret_2025_changez_en_production
VITE_API_URL=/api
```

### 2. Pour Vercel

Lors du déploiement sur Vercel, ajoutez ces variables d'environnement dans les settings :
- `MONGODB_URI` = la connection string ci-dessus
- `JWT_SECRET` = un secret sécurisé (changez celui par défaut)

### 3. Vérifier la connexion

Pour tester la connexion MongoDB :

1. Assurez-vous que votre IP est autorisée dans MongoDB Atlas (Network Access)
2. Pour le développement local, autorisez `0.0.0.0/0` (toutes les IPs)
3. Pour la production Vercel, vous pouvez aussi utiliser `0.0.0.0/0` ou les IPs spécifiques de Vercel

## Collections créées automatiquement

Les collections suivantes seront créées automatiquement lors de la première utilisation :
- `users` - Utilisateurs
- `categories` - Catégories de produits
- `products` - Produits
- `orders` - Commandes

## Sécurité

⚠️ **Important** : 
- Ne commitez JAMAIS le fichier `.env` dans Git
- Changez le `JWT_SECRET` en production avec une valeur aléatoire sécurisée
- Le fichier `.env` est déjà dans `.gitignore`

