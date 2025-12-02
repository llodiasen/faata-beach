# 🔄 Synchronisation des Commandes entre l'App et Odoo

## 📊 Situation Actuelle

### Dans l'Application (MongoDB)
- ✅ Commandes créées directement dans l'app
- ✅ Statuts : `pending`, `accepted`, `preparing`, `ready`, `assigned`, `on_the_way`, `delivered`, `cancelled`
- ✅ Types : `sur_place`, `emporter`, `livraison`
- ✅ Gestion des livreurs et assignation
- ✅ Suivi en temps réel

### Dans Odoo
- ✅ Commandes de vente (Sales Orders)
- ✅ Statuts : `draft`, `sent`, `sale`, `done`, `cancel`
- ✅ Gestion comptable et facturation
- ✅ Gestion des stocks
- ✅ Rapports et analyses

## 🔗 Relation Actuelle : **AUCUNE**

Actuellement, les deux systèmes fonctionnent **indépendamment** :
- ❌ Les commandes de l'app ne sont **pas** synchronisées vers Odoo
- ❌ Les commandes Odoo ne sont **pas** synchronisées vers l'app
- ❌ Pas de lien entre les deux systèmes

## 🎯 Options de Synchronisation

### Option 1 : Synchronisation App → Odoo (Recommandé)
**Quand :** À chaque création de commande dans l'app

**Avantages :**
- ✅ Toutes les commandes clients dans Odoo
- ✅ Facturation automatique
- ✅ Gestion des stocks
- ✅ Rapports complets

**Comment :**
1. Quand une commande est créée dans l'app → Créer une Sales Order dans Odoo
2. Mapper les produits via External ID
3. Synchroniser les statuts

### Option 2 : Synchronisation Bidirectionnelle
**Quand :** App ↔ Odoo en temps réel

**Avantages :**
- ✅ Synchronisation complète
- ✅ Modifications possibles dans les deux sens

**Inconvénients :**
- ⚠️ Plus complexe
- ⚠️ Risque de conflits

### Option 3 : Export Manuel
**Quand :** Export périodique (quotidien/hebdomadaire)

**Avantages :**
- ✅ Simple
- ✅ Contrôle total

**Inconvénients :**
- ❌ Pas en temps réel
- ❌ Manuelle

## 🚀 Solution Recommandée : Synchronisation App → Odoo

### Architecture Proposée

```
App (MongoDB)                    Odoo
     │                              │
     │ 1. Commande créée            │
     ├─────────────────────────────>│
     │                              │ 2. Créer Sales Order
     │                              │
     │ 3. Statut mis à jour         │
     ├─────────────────────────────>│
     │                              │ 4. Mettre à jour statut
     │                              │
```

### Mapping des Statuts

| App | Odoo |
|-----|------|
| `pending` | `draft` |
| `accepted` | `sent` |
| `preparing` | `sent` |
| `ready` | `sale` |
| `assigned` | `sale` |
| `on_the_way` | `sale` |
| `delivered` | `done` |
| `cancelled` | `cancel` |

### Mapping des Types de Commande

| App | Odoo |
|-----|------|
| `sur_place` | Sur place |
| `emporter` | À emporter |
| `livraison` | Livraison |

## 📝 Implémentation

### Étape 1 : Ajouter External ID Odoo aux Commandes

Ajouter un champ `odooOrderId` dans le modèle Order pour stocker l'ID de la commande Odoo.

### Étape 2 : Créer un Webhook/Script de Synchronisation

Quand une commande est créée dans l'app :
1. Appeler l'API Odoo pour créer une Sales Order
2. Stocker l'ID Odoo dans la commande MongoDB
3. Mapper les produits via External ID
4. Synchroniser les statuts

### Étape 3 : Mettre à jour les Statuts

Quand le statut change dans l'app :
1. Mettre à jour le statut dans Odoo via l'API

## 🔧 Configuration Requise

### Dans Odoo
1. Activer l'API REST
2. Créer un utilisateur API avec permissions
3. Obtenir l'URL de l'API et les credentials

### Dans l'App
1. Ajouter les variables d'environnement Odoo :
   - `ODOO_URL` : URL de votre instance Odoo
   - `ODOO_DATABASE` : Nom de la base de données
   - `ODOO_USERNAME` : Nom d'utilisateur API
   - `ODOO_API_KEY` : Clé API

## 📋 Prochaines Étapes

1. ✅ Exporter les produits vers Odoo (FAIT)
2. ⏳ Créer le script de synchronisation des commandes
3. ⏳ Tester la synchronisation
4. ⏳ Mettre en place la synchronisation automatique

