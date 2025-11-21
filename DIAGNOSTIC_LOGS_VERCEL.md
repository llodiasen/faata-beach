# 🔍 Diagnostic : Voir les logs Vercel pour trouver l'erreur exacte

## 🎯 L'erreur 500 persiste - Vérifions les logs

L'erreur 500 indique que l'API crash, mais nous devons voir **l'erreur exacte** dans les logs Vercel.

## 📋 Comment voir les logs Vercel

### Étape 1 : Accéder aux logs

1. 🌐 Allez sur https://vercel.com/dashboard
2. 🔐 Connectez-vous
3. 📁 Sélectionnez votre projet **"faata-beach"**
4. 📋 Cliquez sur **"Deployments"** dans le menu de gauche
5. 👁️ Vous verrez la liste de vos déploiements

### Étape 2 : Voir les logs du dernier déploiement

1. 🖱️ Cliquez sur le **dernier déploiement** (celui en haut de la liste)
   - C'est probablement celui avec l'erreur 500
2. 🔍 Vous verrez plusieurs onglets :
   - **Overview** (aperçu)
   - **Logs** (logs)
   - **Functions** (fonctions serverless)
   - **Build Logs** (logs de build)

### Étape 3 : Voir les logs de la fonction API

**Option A : Onglet "Functions"** (recommandé)
1. 🖱️ Cliquez sur l'onglet **"Functions"**
2. 👁️ Vous verrez la liste des fonctions serverless :
   - `/api/categories`
   - `/api/products`
   - etc.
3. 🖱️ Cliquez sur **`/api/categories`**
4. 👁️ Vous verrez les logs de cette fonction spécifique

**Option B : Onglet "Logs"**
1. 🖱️ Cliquez sur l'onglet **"Logs"**
2. 🔍 Cherchez les erreurs liées à `/api/categories`
3. 👁️ Regardez les messages d'erreur

### Étape 4 : Identifier l'erreur

**Cherchez ces erreurs spécifiques** :

#### ❌ Erreur 1 : MONGODB_URI manquante
```
MONGODB_URI is not defined
Configuration error: MONGODB_URI is missing
```
**Solution** : Vérifiez que `MONGODB_URI` existe dans Environment Variables

#### ❌ Erreur 2 : MongoDB connection timeout
```
MongoNetworkError: connection timeout
ENOTFOUND
ETIMEDOUT
```
**Solution** : MongoDB bloque les connexions → Configurez Network Access avec `0.0.0.0/0`

#### ❌ Erreur 3 : MongoDB authentication failed
```
MongoServerError: authentication failed
bad auth
```
**Solution** : Mot de passe MongoDB incorrect → Vérifiez `MONGODB_URI` dans Vercel

#### ❌ Erreur 4 : Autre erreur
Si vous voyez une autre erreur, **copiez-moi le message exact** et je pourrai vous aider !

---

## 🔍 Vérifications supplémentaires

### Vérification 1 : MongoDB Network Access

**Même si vous avez déjà vérifié, refaites-le** :

1. 🌐 Allez sur https://cloud.mongodb.com
2. 🔐 Connectez-vous
3. 📦 Sélectionnez votre cluster **"Faatabeach"**
4. ⚙️ Menu de gauche → **"Network Access"**
5. 👁️ Vérifiez s'il y a une entrée avec `0.0.0.0/0`
   - ✅ **Si oui** → Passez à la vérification 2
   - ❌ **Si non** → Continuez :
6. ➕ Cliquez sur **"Add IP Address"** (bouton vert)
7. 🌍 Cliquez sur **"Allow Access from Anywhere"**
8. ✅ Cliquez sur **"Confirm"**
9. ⏳ Attendez 1-2 minutes
10. 🔄 Retournez sur Vercel et redéployez

### Vérification 2 : Variables d'environnement dans Vercel

**Vérifiez une dernière fois** :

1. 🌐 Dashboard Vercel → **Settings** → **Environment Variables**
2. 👁️ Vérifiez que vous avez exactement 2 variables :

   **Variable 1 :**
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority`
   - ✅ Pas d'espaces avant ou après

   **Variable 2 :**
   - Name: `JWT_SECRET`
   - Value: `faata_beach_jwt_secret_2025_changez_en_production`
   - ✅ Pas d'espaces avant ou après

3. ✅ Vérifiez que les 3 environnements sont cochés (ou "All Environments" est sélectionné)

### Vérification 3 : Redéployer après modifications

**Important** : Après avoir modifié les variables ou Network Access :

1. 📋 Allez dans **Deployments**
2. 🖱️ Cliquez sur les **"..."** (3 points) du dernier déploiement
3. 🔄 Cliquez sur **"Redeploy"**
4. ✅ Confirmez
5. ⏳ Attendez 2-3 minutes

---

## 📋 Actions à faire maintenant

1. ✅ **Voir les logs Vercel** → Identifiez l'erreur exacte
2. ✅ **Vérifier MongoDB Network Access** → `0.0.0.0/0` est configuré ?
3. ✅ **Vérifier les variables Vercel** → `MONGODB_URI` et `JWT_SECRET` sont correctes ?
4. ✅ **Redéployer** → Après chaque modification

---

## 🆘 Ce que j'ai besoin de vous

**Pour vous aider précisément, donnez-moi** :

1. ✅ **Les logs Vercel** : Que voyez-vous dans Functions/Logs pour `/api/categories` ?
   - Copiez-moi les dernières lignes d'erreur
2. ✅ **Network Access MongoDB** : Avez-vous configuré `0.0.0.0/0` ?
3. ✅ **Variables Vercel** : `MONGODB_URI` et `JWT_SECRET` sont-elles correctes (sans espaces) ?

Avec ces informations, je pourrai vous donner la solution exacte ! 🎯

---

## 💡 Astuce : Test direct de l'API

Pendant que vous vérifiez les logs, testez aussi directement l'API :

**Ouvrez cette URL dans votre navigateur :**
```
https://faata-beach.vercel.app/api/categories
```

**Si vous voyez** :
- `[]` (vide) → MongoDB est connecté mais vide → Importez les données
- Liste JSON → Tout fonctionne !
- Erreur JSON → Copiez-moi l'erreur exacte

