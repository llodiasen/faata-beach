# 🚀 Guide Rapide : Synchronisation App → Odoo

## ✅ Ce qui a été fait

1. ✅ Module Odoo créé (`api/lib/odoo.ts`)
2. ✅ Modèle Order modifié (ajout du champ `odooOrderId`)
3. ✅ Synchronisation automatique intégrée dans la création de commande
4. ✅ Documentation créée

## ⚙️ Configuration (5 minutes)

### 1. Ajouter les variables dans `.env`

```env
ODOO_URL=https://faata-beach.odoo.com
ODOO_DATABASE=faata-beach
ODOO_USERNAME=votre_username
ODOO_API_KEY=votre_api_key
```

### 2. Dans Odoo

1. **Créer un utilisateur API** (ou utiliser un existant)
2. **Générer une clé API** : Profil → Préférences → API Keys → Générer
3. **Vérifier les droits** : Ventes (accès complet), Produits (lecture)

### 3. Tester

1. Créez une commande dans l'app
2. Vérifiez les logs dans la console :
   - ✅ `Commande Odoo créée avec ID: XXX` → Ça marche !
   - ⚠️ Messages d'avertissement → Vérifiez la configuration
3. Vérifiez dans Odoo : Ventes → Commandes → Vous devriez voir la commande

## 🔄 Comment ça marche

Quand un client crée une commande dans l'app :

1. ✅ Commande sauvegardée dans MongoDB
2. ✅ Synchronisation automatique vers Odoo (en arrière-plan)
3. ✅ Création d'une Sales Order dans Odoo
4. ✅ ID Odoo stocké dans `odooOrderId`

**Important** : Si Odoo est indisponible, la commande est quand même créée dans l'app !

## 📋 Prérequis

- ✅ Produits exportés vers Odoo avec External IDs
- ✅ Configuration Odoo complète
- ✅ API Odoo activée

## 🐛 Dépannage

### "Configuration Odoo incomplète"
→ Vérifiez les variables dans `.env`

### "Impossible de s'authentifier"
→ Vérifiez `ODOO_USERNAME` et `ODOO_API_KEY`

### "Produit Odoo introuvable"
→ Vérifiez que les produits ont été exportés avec External IDs

## 📚 Documentation complète

Voir `CONFIG_ODOO.md` pour plus de détails.

