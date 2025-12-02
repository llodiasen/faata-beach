# 🧪 Test de Synchronisation Odoo

## ⚠️ Prérequis IMPORTANT

**Les produits DOIVENT avoir un External ID Odoo dans leur description !**

Format requis dans la description du produit :
```
[Odoo ID: product_template_salade_ni_oise_1]
```

Si les produits n'ont pas cet External ID, la synchronisation ne fonctionnera pas.

## 📋 Étapes de Test

### Étape 1 : Vérifier que les Produits ont un External ID

**Option A : Via MongoDB (Recommandé)**
1. Connectez-vous à MongoDB Atlas
2. Allez dans votre base de données `faata-beach`
3. Collection `products`
4. Ouvrez un document produit
5. Vérifiez que le champ `description` contient : `[Odoo ID: product_template_xxx]`
   - Exemple : `[Odoo ID: product_template_salade_ni_oise_1]`
   - Le format exact est important : `[Odoo ID: ` suivi de l'External ID Odoo

**Option B : Via l'Application**
1. Ouvrez un produit dans l'application (cliquez sur un produit)
2. Dans la section "Description", vérifiez qu'elle contient : `[Odoo ID: product_template_xxx]`
   - ⚠️ Note : L'ID Odoo sera visible dans la description affichée à l'utilisateur
3. **Alternative : Vérifier via l'API directement**
   - Faites une requête GET vers `/api/products` ou `/api/products/[id]`
   - Vérifiez le champ `description` dans la réponse JSON

### Étape 2 : Passer une Commande Test

1. **Ouvrez votre application** (en production ou local)
2. **Ajoutez 1-2 produits** au panier
   - Choisissez des produits qui ont un External ID Odoo
3. **Validez la commande**
   - Remplissez les informations (nom, téléphone, etc.)
   - Choisissez le type (sur place/emporter/livraison)
   - Cliquez sur "Valider"

### Étape 3 : Vérifier les Logs Vercel (2-3 secondes après)

1. Allez sur https://vercel.com
2. Projet `faata-beach`
3. Cliquez sur **"Functions"** → **"Logs"**
4. Cherchez les messages suivants :

#### ✅ **SUCCÈS** :
```
✅ Commande Odoo créée avec ID: 12345
```

#### ❌ **ERREURS POSSIBLES** :

**Erreur 1 : Configuration manquante**
```
⚠️  Configuration Odoo incomplète, synchronisation ignorée
```
→ Vérifiez les variables d'environnement dans Vercel

**Erreur 2 : Authentification échouée**
```
❌ Impossible de s'authentifier à Odoo
```
→ Vérifiez `ODOO_USERNAME` et `ODOO_API_KEY`

**Erreur 3 : Produit sans External ID**
```
⚠️  Produit Pizza reine sans External ID Odoo, ignoré
```
→ Les produits doivent être exportés vers Odoo d'abord

**Erreur 4 : Produit introuvable dans Odoo**
```
⚠️  Produit Odoo product_template_salade_ni_oise_1 introuvable, ignoré
```
→ L'External ID ne correspond pas à un produit Odoo existant

### Étape 4 : Vérifier dans Odoo

1. **Connectez-vous à Odoo** : https://faata-beach.odoo.com
2. **Allez dans** : Ventes → Commandes
3. **Recherchez** : Tapez `APP-` dans la barre de recherche
4. **Votre commande devrait apparaître** avec :
   - Référence : `APP-{8 premiers caractères de l'ID}`
   - Statut : "Brouillon" (Draft)
   - Produits : Ceux que vous avez commandés

## 🔧 Si ça ne fonctionne pas

### Problème : Aucune commande n'apparaît dans Odoo

**Vérifications :**

1. ✅ **Variables d'environnement Vercel** :
   - `ODOO_URL` = `https://faata-beach.odoo.com`
   - `ODOO_DATABASE` = `faata-beach`
   - `ODOO_USERNAME` = `contact@faatabeach.com`
   - `ODOO_API_KEY` = `f69a536f18570ca07eea43722299d320e8a29240`

2. ✅ **Produits exportés vers Odoo** :
   - Les produits doivent avoir été exportés via le script `export-to-odoo.ts`
   - Chaque produit doit avoir un External ID dans sa description

3. ✅ **Logs Vercel** :
   - Vérifiez les erreurs dans les logs
   - Notez les messages d'erreur exacts

### Problème : "Produit sans External ID Odoo"

**Solution :**
1. Exportez les produits vers Odoo :
   ```bash
   npm run export-to-odoo
   ```
2. Vérifiez que les produits ont bien l'External ID dans leur description
3. Réessayez une commande

### Problème : "Produit Odoo introuvable"

**Solution :**
1. Vérifiez dans Odoo que le produit existe
2. Vérifiez que l'External ID dans la description correspond bien
3. Le format doit être : `[Odoo ID: product_template_xxx]` (ex: `[Odoo ID: product_template_salade_ni_oise_1]`)

## 📊 Exemple de Test Réussi

```
1. Commande créée dans l'app : ID = 692e239b869f7a861b07607f
2. Log Vercel : ✅ Commande Odoo créée avec ID: 12345
3. Dans Odoo : Commande trouvée avec référence APP-692e239b
4. Statut : Brouillon
5. Produits : ✅ Tous présents
```

## 🎯 Test Rapide (1 minute)

1. **Commande test** : 1 produit simple (ex: Coca)
2. **Validez** la commande
3. **Attendez 3 secondes**
4. **Recherchez** `APP-` dans Odoo
5. **Vérifiez** que la commande apparaît

---

**Note** : La synchronisation est **asynchrone** et **non-bloquante**. 
Même si Odoo est lent, votre commande est toujours créée dans l'application.

