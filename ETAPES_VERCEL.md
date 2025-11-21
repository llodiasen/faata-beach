# ✅ Étapes pour déployer sur Vercel - FAATA Beach

## ✅ Étape 1 : Code sur GitHub - TERMINÉE
Votre code est maintenant sur : https://github.com/llodiasen/faata-beach

---

## 📋 Étape 2 : Connecter à Vercel

### 2.1 Aller sur Vercel
1. Ouvrez votre navigateur et allez sur : **https://vercel.com**
2. **Cliquez sur "Sign Up"** ou **"Log In"** si vous avez déjà un compte
3. **Connectez-vous avec GitHub** (recommandé pour simplifier)

### 2.2 Créer un nouveau projet
1. Une fois connecté, cliquez sur **"Add New..."** ou **"New Project"**
2. Vous verrez la liste de vos repositories GitHub
3. **Trouvez "llodiasen/faata-beach"** dans la liste
4. **Cliquez sur "Import"** à côté du repository

---

## ⚙️ Étape 3 : Configurer le projet Vercel

### 3.1 Configuration automatique
Vercel devrait détecter automatiquement :
- ✅ **Framework Preset** : Vite
- ✅ **Root Directory** : `./` (laissez par défaut)
- ⚠️ **Build Command** : **CHANGEZ** `vite build` en `npm run build`
- ✅ **Output Directory** : `dist` (laissez par défaut)
- ✅ **Install Command** : automatique (laissez par défaut)

**💡 Important** : Si le Build Command affiche `vite build`, changez-le en `npm run build`

### 3.2 Variables d'environnement ⚠️ IMPORTANT
Avant de cliquer sur "Deploy", ajoutez les variables d'environnement :

1. **Dans la section "Environment Variables"**, cliquez sur **"Add"** ou **"Add Environment Variable"**

2. **Ajoutez la première variable** :
   - **Name** : `MONGODB_URI`
   - **Value** : `mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority`
     - ⚠️ **ATTENTION** : Copiez TOUTE la valeur, du début à la fin !
     - 📋 **Valeur complète à copier** :
       ```
       mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
       ```
   - **Cochez** : ✅ Production, ✅ Preview, ✅ Development
   - Cliquez sur **"Add"**

3. **Ajoutez la deuxième variable** :
   - **Name** : `JWT_SECRET`
   - **Value** : `faata_beach_jwt_secret_2025_changez_en_production`
     - ⚠️ **ATTENTION** : Copiez TOUTE la valeur, du début à la fin !
     - 📋 **Valeur complète à copier** :
       ```
       faata_beach_jwt_secret_2025_changez_en_production
       ```
     - ⚠️ **Explication** : C'est une clé secrète pour sécuriser l'authentification des utilisateurs
   - **Cochez** : ✅ Production, ✅ Preview, ✅ Development
   - Cliquez sur **"Add"**
   
   **📝 Note importante** : 
   - Le JWT_SECRET est une clé secrète utilisée pour crypter/décrypter les tokens d'authentification
   - Assurez-vous de copier la valeur COMPLÈTE (pas juste le début)

**⚠️ ATTENTION** : Il est important de cocher les 3 environnements (Production, Preview, Development) pour que les variables fonctionnent partout !

---

## 🚀 Étape 4 : Déployer

1. **Vérifiez que toutes les variables sont ajoutées** dans la liste
2. **Cliquez sur le bouton "Deploy"** en bas de la page
3. **Attendez 2-3 minutes** pendant que Vercel :
   - Installe les dépendances
   - Compile votre application
   - Déploie sur leurs serveurs

---

## ✅ Étape 5 : Vérifier le déploiement

### 5.1 Votre site est en ligne !
Une fois le déploiement terminé, vous verrez :
- ✅ Un message "Congratulations"
- ✅ Votre URL : `https://faata-beach-xxxxx.vercel.app` (ou similaire)

### 5.2 Tester votre site
1. **Cliquez sur l'URL** ou **"Visit"** pour ouvrir votre site
2. **Testez** :
   - ✅ La page d'accueil s'affiche
   - ✅ Les boutons fonctionnent
   - ✅ Vous pouvez ouvrir les modales
   - ✅ Les catégories se chargent (vérifiez la console F12 si problème)

### 5.3 Vérifier les logs (si problème)
1. Dans le dashboard Vercel, allez dans **"Deployments"**
2. Cliquez sur votre dernier déploiement
3. Cliquez sur **"Functions"** pour voir les logs des API
4. Cliquez sur **"Logs"** pour voir les erreurs éventuelles

---

## 🔧 Étape 6 : Configurer MongoDB Atlas

Pour que vos API fonctionnent, MongoDB doit accepter les connexions de Vercel :

1. **Allez sur MongoDB Atlas** : https://cloud.mongodb.com
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre cluster** "faatabeach"
4. **Cliquez sur "Network Access"** dans le menu de gauche
5. **Cliquez sur "Add IP Address"**
6. **Cliquez sur "Allow Access from Anywhere"** (ajoute `0.0.0.0/0`)
7. **Cliquez sur "Confirm"**

**✅ Maintenant MongoDB acceptera les connexions depuis Vercel !**

---

## 📊 Résumé des URLs

- **GitHub Repository** : https://github.com/llodiasen/faata-beach
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Votre site** : `https://faata-beach-xxxxx.vercel.app` (vous verrez l'URL exacte après le déploiement)

---

## 🎉 C'est terminé !

Votre application FAATA Beach est maintenant en ligne sur Vercel !

### Prochaines étapes (optionnelles) :
1. ✅ Ajouter un domaine personnalisé (dans Vercel → Settings → Domains)
2. ✅ Configurer les icônes PWA dans `public/icons/`
3. ✅ Améliorer le JWT_SECRET en production (générer un secret plus sécurisé)

---

## ❓ Problèmes courants

### Erreur : "Environment variable not found"
→ Vérifiez que vous avez bien ajouté les variables et coché les 3 environnements

### Erreur : "MongoDB connection failed"
→ Vérifiez que MongoDB Atlas autorise les connexions depuis `0.0.0.0/0`

### 404 sur les API
→ Vérifiez que `vercel.json` est bien présent à la racine (déjà fait ✅)

### Le site se charge mais les API ne fonctionnent pas
→ Vérifiez les logs dans Vercel Dashboard → Deployments → Functions

