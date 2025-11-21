# ✅ Checklist pour résoudre l'erreur API

## 🔍 Vérifications à faire maintenant

### 1. ✅ Vérifier les logs dans la console du navigateur

1. **Ouvrez votre site Vercel** dans le navigateur
2. **Ouvrez la console développeur** (F12 ou Clic droit → Inspecter)
3. **Onglet Console** - Regardez les erreurs
4. Vous devriez voir des logs comme :
   - `[API] Fetching: /api/categories`
   - `[API] Response status: ...`
   - `[API] Error response: ...`

**Copiez-moi les erreurs que vous voyez dans la console** pour que je puisse vous aider à les résoudre.

### 2. ⚠️ Vérifier MongoDB Atlas - Network Access

**Cette étape est CRITIQUE** - Sans ça, MongoDB ne peut pas se connecter depuis Vercel :

1. Allez sur https://cloud.mongodb.com
2. Connectez-vous
3. Sélectionnez votre cluster **"Faatabeach"**
4. Dans le menu de gauche, cliquez sur **"Network Access"**
5. Vérifiez qu'il y a une entrée avec :
   - **IP Address** : `0.0.0.0/0` (ou "Allow Access from Anywhere")
   - **Status** : Active
6. Si ce n'est pas le cas :
   - Cliquez sur **"Add IP Address"**
   - Cliquez sur **"Allow Access from Anywhere"** 
   - Cliquez sur **"Confirm"**
   - ⏳ Attendez 1-2 minutes que ça prenne effet

### 3. ⚠️ Vérifier les variables d'environnement dans Vercel

1. Allez sur votre **dashboard Vercel**
2. Sélectionnez le projet **faata-beach**
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que vous avez :

   **MONGODB_URI** :
   ```
   mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
   ```
   - ✅ Vérifiez que c'est bien TOUTE la valeur (du début `mongodb+srv://...` à la fin `...majority`)

   **JWT_SECRET** :
   ```
   faata_beach_jwt_secret_2025_changez_en_production
   ```
   - ✅ Vérifiez que c'est bien TOUTE la valeur

5. Pour chaque variable :
   - ✅ **Production** doit être coché
   - ✅ **Preview** doit être coché
   - ✅ **Development** doit être coché

6. Si les variables ne sont pas complètes :
   - Cliquez sur le bouton **"Edit"** ou **"Delete"** 
   - Supprimez la variable
   - Ajoutez-la à nouveau avec la valeur COMPLÈTE
   - Cochez les 3 environnements
   - **Redéployez** après avoir modifié les variables

### 4. 📊 Tester l'API directement

Testez l'API depuis votre navigateur :

1. Allez sur : `https://votre-projet.vercel.app/api/categories`
   - Remplacez `votre-projet` par votre nom de projet Vercel

2. **Si ça fonctionne** :
   - Vous verrez un JSON avec les catégories
   - Ou un tableau vide `[]` si MongoDB est vide mais la connexion fonctionne

3. **Si ça ne fonctionne pas** :
   - Vous verrez un message d'erreur JSON
   - Notez le message d'erreur

### 5. 💾 Importer les données dans MongoDB

Si MongoDB est vide ou si c'est la première fois, vous devez importer les catégories et produits :

**Option A : Via le script local** (si vous avez le projet en local)
```bash
npm run import-data
```

**Option B : Créer manuellement dans MongoDB Atlas**
1. Allez sur MongoDB Atlas → **Collections**
2. Créez une catégorie pour tester :
   ```json
   {
     "name": "Boissons",
     "isActive": true,
     "displayOrder": 1
   }
   ```

## 📋 Informations à me donner

Pour que je puisse mieux vous aider, donnez-moi :

1. **Les erreurs dans la console du navigateur** (F12 → Console)
2. **Ce qui s'affiche** quand vous allez sur `/api/categories` directement
3. **Si MongoDB Network Access** est bien configuré avec `0.0.0.0/0`
4. **Si les variables d'environnement** sont bien configurées dans Vercel

Avec ces informations, je pourrai vous aider à résoudre le problème précisément ! 🎯

