# 🔧 Configuration Odoo pour Synchronisation Automatique

## 📋 Vue d'ensemble

Quand une commande est créée dans l'application, elle est **automatiquement synchronisée** vers Odoo pour créer une Sales Order.

## ⚙️ Configuration Requise

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
ODOO_URL=https://faata-beach.odoo.com
ODOO_DATABASE=faata-beach
ODOO_USERNAME=votre_username_odoo
ODOO_API_KEY=votre_api_key_odoo
```

### 2. Dans Odoo

#### A. Activer l'API REST

1. Allez dans **Paramètres** → **Technique** → **API**
2. Vérifiez que l'API REST est activée

#### B. Créer un utilisateur API

1. Allez dans **Paramètres** → **Utilisateurs et entreprises** → **Utilisateurs**
2. Créer un nouvel utilisateur ou utiliser un existant
3. Attribuer les droits suivants :
   - ✅ **Ventes** : Accès complet
   - ✅ **Produits** : Accès en lecture
   - ✅ **API** : Accès API

#### C. Générer une clé API

1. Allez dans le profil de l'utilisateur
2. Section **Préférences** → **API Keys**
3. Cliquez sur **Générer une clé API**
4. **Copiez la clé** (elle ne sera affichée qu'une seule fois)

### 3. Dans Vercel (Production)

Ajoutez les mêmes variables d'environnement dans **Settings** → **Environment Variables** :

- `ODOO_URL`
- `ODOO_DATABASE`
- `ODOO_USERNAME`
- `ODOO_API_KEY`

⚠️ **Important** : Cochez **Production** pour chaque variable.

## 🔄 Comment ça fonctionne

### Flux de synchronisation

```
1. Client crée une commande dans l'app
   ↓
2. Commande sauvegardée dans MongoDB
   ↓
3. Synchronisation automatique vers Odoo (en arrière-plan)
   ↓
4. Création d'une Sales Order dans Odoo
   ↓
5. ID Odoo stocké dans la commande MongoDB (odooOrderId)
```

### Mapping des produits

Les produits sont mappés via leur **External ID** stocké dans la description :
- Format : `[Odoo ID: product_template_1]`
- Le script recherche le produit dans Odoo par cet External ID
- Si trouvé → Ajout à la commande Odoo
- Si non trouvé → Produit ignoré (mais commande créée quand même)

### Gestion des erreurs

- ✅ Si Odoo n'est pas disponible → La commande est quand même créée dans l'app
- ✅ Si un produit n'a pas d'External ID → Il est ignoré, les autres produits sont ajoutés
- ✅ Si la synchronisation échoue → Un log d'erreur est créé, mais la commande reste valide

## 📊 Vérification

### Tester la synchronisation

1. Créez une commande dans l'app
2. Vérifiez les logs dans la console :
   - ✅ `Commande Odoo créée avec ID: XXX` → Succès
   - ⚠️ Messages d'avertissement → Produits non mappés
   - ❌ Messages d'erreur → Problème de configuration

3. Vérifiez dans Odoo :
   - Allez dans **Ventes** → **Commandes**
   - Vous devriez voir la nouvelle commande avec la référence `APP-XXXXX`

### Vérifier le champ odooOrderId

Dans MongoDB, vérifiez que la commande a le champ `odooOrderId` :
```javascript
db.orders.findOne({ _id: ObjectId("...") })
// Devrait afficher : { ..., odooOrderId: 123 }
```

## 🔍 Dépannage

### Erreur : "Configuration Odoo incomplète"

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Vérifiez que toutes les variables sont dans `.env`
2. Redémarrez le serveur de développement
3. Pour Vercel, vérifiez dans Settings → Environment Variables

### Erreur : "Impossible de s'authentifier à Odoo"

**Cause** : Identifiants incorrects ou API désactivée

**Solution** :
1. Vérifiez `ODOO_USERNAME` et `ODOO_API_KEY`
2. Vérifiez que l'API REST est activée dans Odoo
3. Testez la connexion depuis Odoo → Paramètres → API

### Erreur : "Produit Odoo introuvable"

**Cause** : External ID manquant ou incorrect

**Solution** :
1. Vérifiez que les produits ont été exportés vers Odoo
2. Vérifiez que la description contient `[Odoo ID: ...]`
3. Réexportez les produits si nécessaire : `npm run export-to-odoo`

### Synchronisation ne fonctionne pas

**Vérifications** :
1. ✅ Variables d'environnement configurées
2. ✅ API Odoo activée
3. ✅ Utilisateur API avec les bons droits
4. ✅ Produits exportés vers Odoo avec External IDs
5. ✅ Logs dans la console pour voir les erreurs

## 📝 Notes importantes

- ⚠️ La synchronisation est **asynchrone** : elle ne bloque pas la création de commande
- ⚠️ Si Odoo est indisponible, la commande est quand même créée dans l'app
- ⚠️ Les produits sans External ID sont ignorés mais n'empêchent pas la création
- ✅ L'ID Odoo est stocké dans `odooOrderId` pour référence future

## 🚀 Prochaines étapes

1. ✅ Configuration Odoo (FAIT)
2. ✅ Synchronisation automatique (FAIT)
3. ⏳ Synchronisation des statuts (à venir)
4. ⏳ Synchronisation bidirectionnelle (optionnel)

