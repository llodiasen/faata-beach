# Configuration - FAATA Beach

## Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
JWT_SECRET=faata_beach_jwt_secret_2025_changez_en_production
VITE_API_URL=/api
VAPID_PUBLIC_KEY=<clé publique VAPID>
VAPID_PRIVATE_KEY=<clé privée VAPID>
VITE_VAPID_PUBLIC_KEY=<copiez la même clé publique>
```

Générez les clés VAPID avec `npx web-push generate-vapid-keys` puis reportez les valeurs dans les variables ci-dessus (la clé publique doit être exposée côté frontend).

## MongoDB Atlas

Votre cluster MongoDB est configuré :
- **Cluster** : Faatabeach
- **Database** : faata-beach (sera créée automatiquement)
- **Connection String** : Déjà configurée ci-dessus

### Vérifications nécessaires

1. **Network Access** dans MongoDB Atlas :
   - Autoriser votre IP actuelle pour le développement local
   - Pour Vercel en production, autoriser `0.0.0.0/0` (toutes les IPs) OU
   - Utiliser les IPs spécifiques de Vercel (plus sécurisé)

2. **Database User** :
   - Utilisateur : `wopallodia92`
   - Vérifier que l'utilisateur a les permissions nécessaires

## Déploiement Vercel

Lors du déploiement sur Vercel, ajoutez ces variables dans **Settings > Environment Variables** :

1. `MONGODB_URI` = `mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority`
2. `JWT_SECRET` = Changez avec une valeur sécurisée aléatoire (ex: générée avec `openssl rand -base64 32`)
3. `VAPID_PUBLIC_KEY` = Clé publique générée
4. `VAPID_PRIVATE_KEY` = Clé privée générée
5. `VITE_VAPID_PUBLIC_KEY` = Même valeur que `VAPID_PUBLIC_KEY`

## Sécurité

⚠️ **IMPORTANT** :
- Le fichier `.env` est dans `.gitignore` - ne sera jamais commité
- Changez le `JWT_SECRET` en production
- Ne partagez jamais vos credentials MongoDB publiquement

