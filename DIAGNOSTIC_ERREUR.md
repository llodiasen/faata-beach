# 🔍 Diagnostic de l'erreur "Une erreur est survenue"

## 🎯 Test immédiat : Vérifier l'API directement

**Testez cette URL dans votre navigateur :**
```
https://faata-beach.vercel.app/api/categories
```

### ✅ Si ça fonctionne :
Vous verrez soit :
- Un tableau vide : `[]` (MongoDB est connecté mais vide)
- Une liste de catégories en JSON (MongoDB est connecté et contient des données)

### ❌ Si ça ne fonctionne pas :
Vous verrez une erreur JSON. **Copiez-moi cette erreur** pour que je puisse vous aider.

---

## 🔍 Causes probables de l'erreur

### 1. 🔒 MongoDB Atlas bloque les connexions (90% des cas)

**Problème** : MongoDB Atlas refuse les connexions depuis Vercel

**Solution** :
1. Allez sur https://cloud.mongodb.com
2. Connectez-vous avec votre compte
3. Cliquez sur votre cluster **"Faatabeach"** (ou le nom de votre cluster)
4. Dans le menu de gauche, cliquez sur **"Network Access"**
5. Vérifiez s'il y a une entrée avec `0.0.0.0/0`
   - ❌ Si ce n'est pas le cas → Continuez à l'étape 6
   - ✅ Si c'est le cas → Passez à la cause #2
6. Cliquez sur **"Add IP Address"** (bouton vert)
7. Cliquez sur **"Allow Access from Anywhere"**
   - Cela ajoute automatiquement `0.0.0.0/0`
8. Cliquez sur **"Confirm"**
9. ⏳ **Attendez 1-2 minutes** que la configuration prenne effet
10. **Rafraîchissez votre site Vercel** et testez à nouveau

### 2. ⚙️ Variables d'environnement incorrectes dans Vercel

**Problème** : `MONGODB_URI` n'est pas correctement configuré dans Vercel

**Vérification** :
1. Allez sur https://vercel.com/dashboard
2. Connectez-vous
3. Sélectionnez votre projet **"faata-beach"**
4. Allez dans **"Settings"** (en haut)
5. Cliquez sur **"Environment Variables"** (dans le menu de gauche)
6. Vérifiez que vous avez une variable nommée `MONGODB_URI`
7. Cliquez sur l'icône **"Edit"** (crayon) à côté de `MONGODB_URI`
8. **Vérifiez que la valeur est COMPLÈTE** :
   ```
   mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
   ```
   - ⚠️ Elle doit commencer par `mongodb+srv://`
   - ⚠️ Elle doit finir par `?retryWrites=true&w=majority`
   - ⚠️ Elle ne doit PAS être tronquée

**Si la valeur est incomplète** :
1. Cliquez sur **"Delete"** pour supprimer la variable
2. Cliquez sur **"Add New"**
3. **Name** : `MONGODB_URI`
4. **Value** : Collez la valeur COMPLÈTE ci-dessus
5. **Cochez** les 3 environnements :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Cliquez sur **"Save"**
7. **Redéployez** votre projet :
   - Allez dans **"Deployments"**
   - Cliquez sur les **"..."** (3 points) du dernier déploiement
   - Cliquez sur **"Redeploy"**

### 3. 📦 Base de données vide

**Problème** : MongoDB Atlas est vide, pas de catégories

**Vérification** :
1. Allez sur https://cloud.mongodb.com
2. Connectez-vous
3. Sélectionnez votre cluster
4. Cliquez sur **"Collections"** (dans le menu de gauche)
5. Vérifiez s'il y a une base de données **"faata-beach"**
6. Vérifiez s'il y a une collection **"categories"**

**Si la base est vide** :

**Option A : Via le script local (si vous avez accès au projet local)**
```bash
cd C:\Users\wopal\Desktop\faata-beach
npm run import-data
```

**Option B : Créer manuellement une catégorie pour tester**
1. Dans MongoDB Atlas → **Collections**
2. Cliquez sur **"Insert Document"**
3. Ajoutez ce JSON :
```json
{
  "name": "Boissons",
  "isActive": true,
  "displayOrder": 1
}
```
4. Cliquez sur **"Insert"**
5. Testez à nouveau votre site

### 4. 🔑 Problème de credentials MongoDB

**Problème** : Le mot de passe MongoDB a changé ou est incorrect

**Vérification** :
1. Allez sur MongoDB Atlas → **Database Access**
2. Vérifiez l'utilisateur **"wopallodia92"**
3. Si le mot de passe a changé, vous devez mettre à jour `MONGODB_URI` dans Vercel

---

## 🎯 Action immédiate : Test rapide

**Testez ces 3 choses dans l'ordre :**

### Test 1 : Tester l'API directement
Allez sur : `https://faata-beach.vercel.app/api/categories`

**Résultat attendu** :
- ✅ `[]` (tableau vide) = MongoDB connecté mais vide → Passez au Test 2
- ✅ Liste de catégories JSON = Tout fonctionne ! → Problème côté frontend
- ❌ Erreur JSON = Problème de connexion MongoDB → Voir cause #1 ou #2

### Test 2 : Vérifier la console du navigateur
1. Ouvrez votre site : `https://faata-beach.vercel.app`
2. Appuyez sur **F12** (ouvre les outils développeur)
3. Allez dans l'onglet **"Console"**
4. Cliquez sur **"Commander"** ou ouvrez la modal des catégories
5. Regardez les messages `[API] Fetching: /api/categories`
6. **Copiez-moi tous les messages d'erreur** que vous voyez

### Test 3 : Vérifier les logs Vercel
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet **"faata-beach"**
3. Allez dans **"Deployments"**
4. Cliquez sur le dernier déploiement
5. Allez dans l'onglet **"Functions"** ou **"Logs"**
6. Cherchez les erreurs liées à `/api/categories`
7. **Copiez-moi les erreurs** que vous voyez

---

## 📋 Informations à me donner pour que je puisse vous aider

Pour résoudre le problème rapidement, j'ai besoin de :

1. ✅ **Résultat du Test 1** : Que voyez-vous quand vous allez sur `/api/categories` ?
2. ✅ **Résultat du Test 2** : Quelles erreurs voyez-vous dans la console (F12) ?
3. ✅ **Résultat du Test 3** : Quelles erreurs voyez-vous dans les logs Vercel ?
4. ✅ **Network Access MongoDB** : Avez-vous configuré `0.0.0.0/0` dans MongoDB Atlas ?
5. ✅ **Variables Vercel** : Avez-vous vérifié que `MONGODB_URI` est complète dans Vercel ?

Avec ces informations, je pourrai vous donner la solution exacte ! 🎯

---

## 🚀 Solution rapide (essayez d'abord)

**Les 3 étapes les plus importantes :**

1. **Configurez Network Access dans MongoDB Atlas** (si pas déjà fait)
2. **Vérifiez les variables d'environnement dans Vercel** (si pas déjà fait)
3. **Redéployez votre projet sur Vercel** après chaque modification

Après chaque étape, **attendez 1-2 minutes** puis testez à nouveau !

