# 🧪 Guide de Test : Synchronisation Odoo

## ✅ Vérifications Préalables (DÉJÀ FAIT)

- ✅ **86/86 produits** ont un ID Odoo valide dans MongoDB
- ✅ **Connexion Odoo** fonctionne correctement
- ✅ **Authentification** réussie (UID: 2)
- ✅ **Produits trouvables** dans Odoo

## 📋 Étapes de Test

### Étape 1 : Vérifier les Variables d'Environnement dans Vercel

**IMPORTANT** : Les variables doivent être configurées dans Vercel pour que la synchronisation fonctionne en production.

1. Allez sur https://vercel.com
2. Projet `faata-beach`
3. **Settings** → **Environment Variables**
4. Vérifiez que ces variables existent :
   - `ODOO_URL` = `https://faata-beach.odoo.com`
   - `ODOO_DATABASE` = `faata-beach`
   - `ODOO_USERNAME` = `contact@faatabeach.com`
   - `ODOO_API_KEY` = `@faatabeach2K25` ⚠️ **Le mot de passe Odoo**
5. Cochez **Production** pour chaque variable
6. Si vous avez modifié les variables, **redéployez** l'application

### Étape 2 : Passer une Commande Test

1. **Ouvrez votre application** :
   - Production : https://faata-beach.vercel.app
   - Ou local : `npm run dev` puis ouvrez http://localhost:5173

2. **Ajoutez 1-2 produits au panier** :
   - Exemples de produits à tester :
     - "Salade niçoise" (ID: `product_template_salade_ni_oise_1`)
     - "Brochettes de lotte" (ID: `product_template_brochettes_de_lotte_2`)
     - "Coca normal" (ID: `product_template_coca_normal_73`)

3. **Validez la commande** :
   - Cliquez sur le panier
   - Remplissez les informations :
     - Nom : "Test Odoo"
     - Téléphone : "123456789"
   - Choisissez le type : **"Sur place"** (plus simple pour le test)
   - Si "Sur place", indiquez un numéro de table : "1"
   - Cliquez sur **"Valider"**

4. **Notez l'ID de la commande** :
   - Dans la console du navigateur (F12), vous devriez voir :
     ```
     CheckoutModal: Order created { _id: "692e..." }
     ```
   - Ou notez l'ID affiché dans le message de confirmation

### Étape 3 : Vérifier les Logs Vercel (2-3 secondes après)

1. Allez sur https://vercel.com
2. Projet `faata-beach`
3. **Deployments** → Cliquez sur le **dernier déploiement**
4. Onglet **"Functions"** (ou **"Logs"**)
5. Cliquez sur **`/api/orders`** dans la liste
6. Cherchez les messages suivants :

#### ✅ **SUCCÈS** :
```
✅ Commande Odoo créée avec ID: 12345
```

#### ❌ **ERREURS POSSIBLES** :

**Erreur 1 : Configuration manquante**
```
⚠️  Configuration Odoo incomplète, synchronisation ignorée
```
→ **Solution** : Vérifiez les variables d'environnement dans Vercel (Étape 1)

**Erreur 2 : Authentification échouée**
```
❌ Impossible de s'authentifier à Odoo
```
→ **Solution** : Vérifiez `ODOO_USERNAME` et `ODOO_API_KEY` dans Vercel

**Erreur 3 : Produit sans External ID**
```
⚠️  Produit Pizza reine sans External ID Odoo, ignoré
```
→ **Solution** : Ne devrait plus arriver (tous les produits ont un ID)

**Erreur 4 : Produit introuvable dans Odoo**
```
⚠️  Produit Odoo product_template_xxx introuvable, ignoré
```
→ **Solution** : Vérifiez que le produit existe dans Odoo avec cet External ID

### Étape 4 : Vérifier dans MongoDB

Vérifiez que la commande a été synchronisée :

```bash
npm run check-last-order
```

Vous devriez voir :
```
✅ ID Odoo: 12345
```

Si vous voyez `❌ AUCUN`, la synchronisation n'a pas fonctionné.

### Étape 5 : Vérifier dans Odoo

1. **Connectez-vous à Odoo** : https://faata-beach.odoo.com
2. **Allez dans** : **Ventes** → **Commandes**
3. **Recherchez** : Tapez `APP-` dans la barre de recherche
4. **Votre commande devrait apparaître** avec :
   - **Référence** : `APP-{8 premiers caractères de l'ID MongoDB}`
     - Exemple : Si l'ID MongoDB est `692ef7753af6119a99b4127a`, la référence sera `APP-692ef775`
   - **Statut** : "Brouillon" (Draft)
   - **Produits** : Ceux que vous avez commandés
   - **Client** : Les informations que vous avez saisies

## 🎯 Checklist de Vérification

- [ ] Variables d'environnement configurées dans Vercel
- [ ] Commande créée dans l'application
- [ ] Logs Vercel montrent `✅ Commande Odoo créée avec ID: ...`
- [ ] Commande MongoDB a un `odooOrderId`
- [ ] Commande visible dans Odoo avec référence `APP-...`

## 🔧 Si ça ne fonctionne pas

### Problème : Aucun message dans les logs Vercel

**Vérifications** :
1. Les variables d'environnement sont-elles bien configurées dans Vercel ?
2. L'application a-t-elle été redéployée après avoir ajouté les variables ?
3. Regardez dans l'onglet **"Functions"** → **`/api/orders`** (pas juste "Logs")

### Problème : "Configuration Odoo incomplète"

**Solution** :
1. Vérifiez que les 4 variables existent dans Vercel
2. Vérifiez qu'elles sont cochées pour **Production**
3. Redéployez l'application

### Problème : "Impossible de s'authentifier à Odoo"

**Solution** :
1. Vérifiez `ODOO_USERNAME` = `contact@faatabeach.com`
2. Vérifiez `ODOO_API_KEY` = `@faatabeach2K25` (le mot de passe)
3. Testez la connexion : `npm run test-odoo`

### Problème : Commande créée mais pas dans Odoo

**Vérifications** :
1. Les produits de la commande ont-ils un ID Odoo valide ?
2. Les produits existent-ils dans Odoo avec ces External IDs ?
3. Regardez les logs Vercel pour voir les warnings

## 📊 Exemple de Test Réussi

```
1. Commande créée dans l'app : ID = 692ef7753af6119a99b4127a
2. Log Vercel : ✅ Commande Odoo créée avec ID: 12345
3. Dans MongoDB : odooOrderId = 12345
4. Dans Odoo : Commande trouvée avec référence APP-692ef775
5. Statut : Brouillon
6. Produits : ✅ Tous présents
```

## 🎉 Test Rapide (1 minute)

1. **Commande test** : 1 produit simple (ex: Coca normal)
2. **Validez** la commande
3. **Attendez 3 secondes**
4. **Vérifiez** les logs Vercel
5. **Recherchez** `APP-` dans Odoo
6. **Vérifiez** que la commande apparaît

---

**Note** : La synchronisation est **asynchrone** et **non-bloquante**. 
Même si Odoo est lent, votre commande est toujours créée dans l'application.

