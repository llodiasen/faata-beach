# ✅ Guide Rapide : Vérifier une Commande dans Odoo

## 🚀 Étapes Rapides

### 1. **Passer une Commande dans l'Application**
- Ajoutez des produits au panier
- Validez la commande
- Notez l'ID de la commande (visible dans l'URL ou les logs)

### 2. **Se Connecter à Odoo**
- URL : https://faata-beach.odoo.com
- Connectez-vous avec votre compte

### 3. **Aller dans les Commandes**
1. Menu : **"Ventes"** → **"Commandes"**
2. Ou directement : https://faata-beach.odoo.com/web#action=&model=sale.order&view_type=list

### 4. **Trouver Votre Commande**
Dans la barre de recherche, tapez : **`APP-`**

Vous verrez toutes les commandes de l'application avec une référence comme :
- `APP-692e239b`
- `APP-692e2b6e`

### 5. **Vérifier les Détails**
Cliquez sur la commande pour voir :
- ✅ Produits commandés
- ✅ Quantités et prix
- ✅ Informations client (dans la note)
- ✅ Type de commande (sur place/emporter/livraison)
- ✅ Table ou adresse de livraison

## 🔍 Si la Commande N'Apparaît Pas

### Vérifier les Logs Vercel :
1. Allez sur https://vercel.com
2. Projet `faata-beach` → **"Functions"** → **"Logs"**
3. Cherchez :
   - ✅ `✅ Commande Odoo créée avec ID: {id}` = **SUCCÈS**
   - ❌ `❌ Erreur création commande Odoo` = **ERREUR**

### Erreurs Courantes :

#### ❌ "Produit Odoo introuvable"
→ Les produits n'ont pas d'External ID Odoo dans leur description
→ Solution : Exporter les produits vers Odoo d'abord

#### ❌ "Impossible de s'authentifier à Odoo"
→ Vérifiez les variables d'environnement dans Vercel :
- `ODOO_URL`
- `ODOO_DATABASE`
- `ODOO_USERNAME`
- `ODOO_API_KEY`

## 📱 Test Rapide

1. **Commande test** : Ajoutez 1 produit au panier
2. **Validez** la commande
3. **Attendez 2-3 secondes** (synchronisation asynchrone)
4. **Vérifiez dans Odoo** : Recherchez `APP-` dans les commandes

## 💡 Astuce

Les commandes sont créées **automatiquement** et **en arrière-plan**. 
Même si Odoo est lent, votre commande dans l'app est toujours créée.

