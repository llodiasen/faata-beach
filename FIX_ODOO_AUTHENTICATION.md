# 🔧 Fix : Authentification Odoo - Access Denied

## ❌ Problème identifié

L'authentification Odoo échoue avec l'erreur **"Access Denied"**.

**Cause** : L'API Key Odoo ne peut pas être utilisée comme mot de passe dans l'authentification standard.

## ✅ Solution

### Option 1 : Utiliser le mot de passe Odoo (Recommandé)

L'authentification Odoo nécessite le **mot de passe de l'utilisateur**, pas l'API Key.

1. **Dans votre fichier `.env` local** :
   ```env
   ODOO_URL=https://faata-beach.odoo.com
   ODOO_DATABASE=faata-beach
   ODOO_USERNAME=contact@faatabeach.com
   ODOO_API_KEY=votre_mot_de_passe_odoo_ici
   ```

2. **Dans Vercel** (Settings → Environment Variables) :
   - `ODOO_URL` = `https://faata-beach.odoo.com`
   - `ODOO_DATABASE` = `faata-beach`
   - `ODOO_USERNAME` = `contact@faatabeach.com`
   - `ODOO_API_KEY` = **Le mot de passe de l'utilisateur Odoo** (pas l'API Key)

### Option 2 : Créer un utilisateur dédié pour l'API

1. **Dans Odoo** :
   - Allez dans **Paramètres** → **Utilisateurs et entreprises** → **Utilisateurs**
   - Créez un nouvel utilisateur (ex: `api@faatabeach.com`)
   - Attribuez les droits :
     - ✅ **Ventes** : Accès complet
     - ✅ **Produits** : Accès en lecture
   - Notez le **mot de passe** de cet utilisateur

2. **Mettez à jour les variables d'environnement** :
   ```env
   ODOO_USERNAME=api@faatabeach.com
   ODOO_API_KEY=le_mot_de_passe_de_cet_utilisateur
   ```

## 🔍 Vérification

Après avoir mis à jour les variables, testez la connexion :

```bash
npm run test-odoo
```

Vous devriez voir :
```
✅ Authentification réussie!
✅ Produit trouvé dans Odoo!
```

## ⚠️ Note importante

- L'API Key Odoo est généralement utilisée pour d'autres types d'authentification (XML-RPC, etc.)
- Pour l'authentification web standard, utilisez le **mot de passe de l'utilisateur**
- Assurez-vous que l'utilisateur a les permissions nécessaires (Ventes, Produits)

## 📝 Après la correction

1. ✅ Mettez à jour les variables dans Vercel
2. ✅ Redéployez l'application (ou attendez le redéploiement automatique)
3. ✅ Testez à nouveau une commande
4. ✅ Vérifiez les logs Vercel pour voir `✅ Commande Odoo créée avec ID: ...`

