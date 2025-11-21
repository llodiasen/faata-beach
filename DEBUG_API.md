# 🐛 Guide de débogage des erreurs API

## Problème : "Une erreur est survenue" dans la modal des catégories

Cette erreur indique que l'API `/api/categories` ne fonctionne pas correctement.

## 🔍 Vérifications à faire

### 1. Vérifier les logs Vercel

1. Allez dans votre **dashboard Vercel**
2. Sélectionnez votre projet **faata-beach**
3. Allez dans **"Deployments"** → Sélectionnez le dernier déploiement
4. Cliquez sur **"Functions"** ou **"Logs"**
5. Cherchez les erreurs liées à `/api/categories`

### 2. Vérifier les variables d'environnement dans Vercel

1. Dans Vercel Dashboard → **Settings** → **Environment Variables**
2. Vérifiez que ces variables sont bien présentes :
   - ✅ `MONGODB_URI` (avec la valeur complète)
   - ✅ `JWT_SECRET` (avec la valeur complète)
3. Vérifiez que les 3 environnements sont cochés : Production, Preview, Development

### 3. Vérifier MongoDB Atlas

1. **Network Access** :
   - Allez sur https://cloud.mongodb.com
   - Sélectionnez votre cluster
   - Allez dans **"Network Access"**
   - Assurez-vous que `0.0.0.0/0` est autorisé (pour accepter toutes les IPs)

2. **Vérifier la connexion** :
   - La connection string doit être correcte dans les variables d'environnement Vercel

### 4. Importer les données dans MongoDB

Si MongoDB est vide, vous devez importer les catégories et produits :

**Option 1 : Script local (si vous avez accès au projet local)**
```bash
npm run import-data
```

**Option 2 : Via MongoDB Atlas**
1. Allez sur MongoDB Atlas → **Collections**
2. Créez manuellement les catégories et produits
3. Ou utilisez MongoDB Compass pour importer les données

**Option 3 : Via l'interface web MongoDB Atlas**
1. Allez dans votre cluster → **Collections**
2. Créez manuellement les données nécessaires

## 🔧 Test direct de l'API

Testez directement l'API depuis votre navigateur ou Postman :

```
https://votre-projet.vercel.app/api/categories
```

**Réponse attendue** :
- ✅ Si ça fonctionne : Liste des catégories en JSON
- ❌ Si ça ne fonctionne pas : Message d'erreur JSON

## 📝 Erreurs courantes

### Erreur : "MongoNetworkError"
→ MongoDB Atlas bloque les connexions depuis Vercel
→ **Solution** : Ajouter `0.0.0.0/0` dans Network Access

### Erreur : "MongoServerError: bad auth"
→ Les identifiants MongoDB sont incorrects
→ **Solution** : Vérifier `MONGODB_URI` dans Vercel

### Erreur : "Cannot read properties of undefined"
→ Les données n'existent pas dans MongoDB
→ **Solution** : Importer les données avec `npm run import-data`

### Erreur 500 : "Internal Server Error"
→ Erreur dans le code de l'API
→ **Solution** : Vérifier les logs Vercel pour voir l'erreur exacte

## 🎯 Solution rapide

**La cause la plus probable** : MongoDB Atlas bloque les connexions OU les données n'existent pas.

1. **Autoriser les IPs dans MongoDB Atlas** :
   - Network Access → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)

2. **Importer les données** :
   - Exécutez `npm run import-data` en local (si vous avez accès)
   - Ou créez manuellement quelques catégories dans MongoDB Atlas pour tester

3. **Vérifier les logs Vercel** :
   - Regardez les logs pour voir l'erreur exacte
   - Cela vous donnera plus d'informations sur ce qui ne va pas

