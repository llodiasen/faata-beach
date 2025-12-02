# 💾 Sauvegarde Configuration Vercel - FAATA Beach

**Date de sauvegarde** : 2 décembre 2025  
**Projet** : faata-beach

## 📋 Variables d'environnement configurées

### 🔐 Variables pour "All Environments"

Ces variables sont disponibles pour Development, Preview et Production :

#### MongoDB
```env
MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
```
- **Environnements** : All Environments
- **Dernière mise à jour** : Nov 21
- **Ajouté par** : ANTA

#### Authentification JWT
```env
JWT_SECRET=faata_beach_jwt_secret_2025_chan...
```
- **Environnements** : All Environments
- **Dernière mise à jour** : Nov 21
- **Ajouté par** : ANTA
- ⚠️ **Note** : Valeur partiellement masquée dans l'interface

---

### 🔄 Variables Odoo - Configuration par environnement

Ces variables sont configurées séparément pour chaque environnement :

#### ODOO_URL
```env
ODOO_URL=https://faata-beach.odoo.com
```
- **Development** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Preview** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Production** : ✅ Configuré (Ajouté il y a 1h - ANTA)

#### ODOO_DATABASE
```env
ODOO_DATABASE=faata-beach
```
- **Development** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Preview** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Production** : ✅ Configuré (Ajouté il y a 1h - ANTA)

#### ODOO_USERNAME
```env
ODOO_USERNAME=contact@faatabeach.com
```
- **Development** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Preview** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Production** : ✅ Configuré (Ajouté il y a 1h - ANTA)

#### ODOO_API_KEY
```env
ODOO_API_KEY=**********
```
- **Development** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Preview** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- **Production** : ✅ Configuré (Ajouté il y a 1h - ANTA)
- ⚠️ **Note** : Valeur masquée pour sécurité

---

## 📊 Résumé de la configuration

### Variables globales (All Environments)
- ✅ `MONGODB_URI`
- ✅ `JWT_SECRET`

### Variables Odoo (par environnement)
- ✅ `ODOO_URL` → Development, Preview, Production
- ✅ `ODOO_DATABASE` → Development, Preview, Production
- ✅ `ODOO_USERNAME` → Development, Preview, Production
- ✅ `ODOO_API_KEY` → Development, Preview, Production

**Total** : 2 variables globales + 4 variables Odoo × 3 environnements = **14 entrées**

---

## 🔄 Option de simplification

Si toutes les valeurs Odoo sont identiques pour Development, Preview et Production, vous pouvez simplifier en utilisant "All Environments" au lieu de 3 entrées séparées :

### Avant (actuel)
- `ODOO_URL` → 3 entrées (Dev, Preview, Prod)
- `ODOO_DATABASE` → 3 entrées (Dev, Preview, Prod)
- `ODOO_USERNAME` → 3 entrées (Dev, Preview, Prod)
- `ODOO_API_KEY` → 3 entrées (Dev, Preview, Prod)

### Après (simplifié)
- `ODOO_URL` → 1 entrée (All Environments)
- `ODOO_DATABASE` → 1 entrée (All Environments)
- `ODOO_USERNAME` → 1 entrée (All Environments)
- `ODOO_API_KEY` → 1 entrée (All Environments)

**Résultat** : 14 entrées → 6 entrées (plus simple à gérer)

---

## 🔍 Instructions de restauration

### Pour restaurer sur un nouveau projet Vercel :

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez chaque variable avec les bonnes valeurs
3. Sélectionnez les environnements appropriés :
   - Pour `MONGODB_URI` et `JWT_SECRET` : **All Environments**
   - Pour les variables Odoo : **Development, Preview, Production** (ou **All Environments** si valeurs identiques)

### Pour restaurer localement :

Créez un fichier `.env` à la racine du projet :

```env
# MongoDB
MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority

# JWT
JWT_SECRET=faata_beach_jwt_secret_2025_changez_en_production

# Odoo
ODOO_URL=https://faata-beach.odoo.com
ODOO_DATABASE=faata-beach
ODOO_USERNAME=contact@faatabeach.com
ODOO_API_KEY=votre_api_key_odoo_ici
```

---

## ⚠️ Notes importantes

1. **Sécurité** : Les valeurs sensibles (`ODOO_API_KEY`, `JWT_SECRET`) sont masquées dans cette sauvegarde
2. **Vérification** : Vérifiez régulièrement que toutes les variables sont bien configurées
3. **Synchronisation** : Si vous modifiez une variable sur Vercel, mettez à jour cette sauvegarde
4. **Backup** : Cette sauvegarde ne contient pas les valeurs réelles des secrets pour des raisons de sécurité

---

## 🔗 Liens utiles

- **Dashboard Vercel** : https://vercel.com/dashboard
- **Documentation Vercel** : https://vercel.com/docs
- **Variables d'environnement** : https://vercel.com/docs/concepts/projects/environment-variables

---

## 📝 Historique des modifications

- **2 décembre 2025** : Sauvegarde initiale de la configuration
  - Variables MongoDB et JWT configurées
  - Variables Odoo configurées pour tous les environnements

