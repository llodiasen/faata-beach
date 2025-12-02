# 🔍 Comment Vérifier les Commandes dans Odoo

## 📋 Où Trouver les Commandes Synchronisées

### 1. **Accéder au Module "Commandes" (Sales Orders)**

1. Connectez-vous à votre instance Odoo : `https://faata-beach.odoo.com`
2. Dans le menu principal, cliquez sur **"Ventes"** (Sales)
3. Cliquez sur **"Commandes"** (Orders) ou **"Commandes clients"** (Customer Orders)

### 2. **Identifier les Commandes de l'Application**

Les commandes synchronisées depuis l'application ont les caractéristiques suivantes :

#### ✅ **Référence Client (Client Order Reference)**
- Format : `APP-{8 premiers caractères de l'ID MongoDB}`
- Exemple : `APP-692e239b` ou `APP-692e2b6e`

#### ✅ **Note de Commande**
La note contient toutes les informations de la commande :
```
Type: sur_place
Table: 3
Client: Nom du client
Tél: +221 77 123 45 67
Note: [Votre note si présente]
```

#### ✅ **Statut Initial**
- Les nouvelles commandes arrivent avec le statut **"Brouillon"** (Draft)
- Elles peuvent être automatiquement passées à **"Envoyé"** (Sent) selon la configuration

### 3. **Filtres Utiles pour Trouver les Commandes**

#### Option A : Filtrer par Référence Client
1. Dans la liste des commandes, cliquez sur **"Filtres"** (Filters)
2. Ajoutez un filtre : **"Référence client"** (Client Order Reference)
3. Entrez `APP-` pour voir toutes les commandes de l'application

#### Option B : Filtrer par Date
1. Cliquez sur **"Filtres"**
2. Ajoutez : **"Date de création"** (Creation Date)
3. Sélectionnez **"Aujourd'hui"** ou la période souhaitée

#### Option C : Recherche Textuelle
1. Utilisez la barre de recherche en haut
2. Tapez `APP-` pour trouver toutes les commandes de l'application

### 4. **Vérifier les Détails d'une Commande**

Cliquez sur une commande pour voir :
- ✅ **Produits commandés** : Liste avec quantités et prix
- ✅ **Informations client** : Nom, téléphone (dans la note)
- ✅ **Type de commande** : Sur place, Emporter, Livraison
- ✅ **Table** : Numéro de table (si sur place)
- ✅ **Adresse** : Adresse de livraison (si livraison)
- ✅ **Total** : Montant total de la commande

### 5. **Vérifier dans les Logs de l'Application**

Si vous voulez vérifier si la synchronisation a fonctionné :

#### Dans les Logs Vercel :
1. Allez sur https://vercel.com
2. Ouvrez votre projet `faata-beach`
3. Cliquez sur **"Functions"** → **"Logs"**
4. Cherchez les messages :
   - ✅ `✅ Commande Odoo créée avec ID: {id}`
   - ❌ `❌ Erreur création commande Odoo: {erreur}`

#### Dans la Base de Données MongoDB :
La commande MongoDB contient le champ `odooOrderId` si la synchronisation a réussi :
```json
{
  "_id": "692e239b869f7a861b07607f",
  "odooOrderId": 12345,  // ← ID de la commande dans Odoo
  "status": "pending",
  ...
}
```

## 🔧 Dépannage

### ❌ **Problème : Aucune commande n'apparaît dans Odoo**

**Vérifications :**
1. ✅ Les variables d'environnement Odoo sont-elles correctement configurées dans Vercel ?
2. ✅ Les produits ont-ils un External ID Odoo dans leur description ? (Format : `[Odoo ID: external_id]`)
3. ✅ Vérifiez les logs Vercel pour voir les erreurs
4. ✅ L'utilisateur API Odoo a-t-il les permissions nécessaires ?

### ❌ **Problème : Erreur "Produit Odoo introuvable"**

**Cause :** Le produit n'a pas d'External ID Odoo ou l'ID ne correspond pas.

**Solution :**
1. Vérifiez que les produits ont été exportés vers Odoo
2. Vérifiez que la description du produit contient : `[Odoo ID: votre_external_id]`
3. Vérifiez que l'External ID existe bien dans Odoo

### ❌ **Problème : Erreur d'authentification**

**Vérifications :**
1. ✅ `ODOO_URL` est correct (avec `https://`)
2. ✅ `ODOO_DATABASE` correspond au nom de votre base Odoo
3. ✅ `ODOO_USERNAME` est l'email de l'utilisateur API
4. ✅ `ODOO_API_KEY` est la clé API générée (pas le mot de passe)

## 📊 Exemple de Commande dans Odoo

```
┌─────────────────────────────────────────────────┐
│ Commande de Vente #SO123                        │
├─────────────────────────────────────────────────┤
│ Référence Client: APP-692e239b                  │
│ Client: Client invité                            │
│ Date: 02/12/2025 14:30                          │
│ Statut: Brouillon                               │
├─────────────────────────────────────────────────┤
│ Produits:                                       │
│  • Pizza reine x2 - 5 000 FCFA                  │
│  • Coca normal x1 - 1 000 FCFA                  │
│  • Salade niçoise x1 - 3 500 FCFA               │
├─────────────────────────────────────────────────┤
│ Total: 9 500 FCFA                                │
├─────────────────────────────────────────────────┤
│ Note:                                           │
│ Type: sur_place                                  │
│ Table: 3                                        │
│ Client: Jean Dupont                             │
│ Tél: +221 77 123 45 67                         │
└─────────────────────────────────────────────────┘
```

## 🎯 Actions Suivantes dans Odoo

Une fois la commande créée dans Odoo, vous pouvez :

1. **Confirmer la commande** : Cliquez sur **"Confirmer"** (Confirm)
2. **Créer une facture** : Depuis la commande, créez une facture client
3. **Gérer le stock** : Les produits sont automatiquement déduits du stock
4. **Suivre la livraison** : Si c'est une livraison, assignez un livreur

## 📝 Notes Importantes

- ⚠️ Les commandes sont créées **automatiquement** à chaque création dans l'app
- ⚠️ La synchronisation est **asynchrone** (ne bloque pas la création de commande)
- ⚠️ Si Odoo est indisponible, la commande est quand même créée dans l'app
- ⚠️ Les erreurs sont loggées mais n'empêchent pas la commande d'être créée

