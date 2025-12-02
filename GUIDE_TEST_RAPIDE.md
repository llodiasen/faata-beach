# ⚡ Guide de Test Rapide - Synchronisation Odoo

## 🎯 Test en 3 Étapes (5 minutes)

### 1️⃣ Vérifier que les Produits sont Exportés vers Odoo

**IMPORTANT** : Les produits DOIVENT avoir un External ID Odoo dans leur description.

**Vérification rapide :**
- Les produits doivent avoir dans leur `description` : `[Odoo ID: product.product_xxx]`
- Si ce n'est pas le cas, exécutez d'abord :
  ```bash
  npm run export-to-odoo
  ```

### 2️⃣ Passer une Commande Test

1. **Ouvrez votre application** : https://faata-beach.vercel.app (ou local)
2. **Ajoutez 1 produit simple** au panier (ex: Coca, Pizza)
3. **Validez la commande** :
   - Remplissez nom, téléphone
   - Choisissez "Sur place" ou "Emporter"
   - Cliquez "Valider"
4. **Notez l'ID de la commande** (visible dans l'URL ou les logs)

### 3️⃣ Vérifier dans Odoo (2-3 secondes après)

1. **Connectez-vous** : https://faata-beach.odoo.com
2. **Allez dans** : Ventes → Commandes
3. **Recherchez** : Tapez `APP-` dans la barre de recherche
4. **Votre commande devrait apparaître** !

## ✅ Signes de Succès

- ✅ Dans les logs Vercel : `✅ Commande Odoo créée avec ID: 12345`
- ✅ Dans Odoo : Commande trouvée avec référence `APP-{id}`
- ✅ Statut : "Brouillon" (Draft)
- ✅ Produits : Tous présents dans la commande

## ❌ Si ça ne fonctionne pas

### Vérifiez les Logs Vercel :

1. https://vercel.com → Projet `faata-beach` → Functions → Logs
2. Cherchez les erreurs :
   - `⚠️ Configuration Odoo incomplète` → Vérifiez les variables d'environnement
   - `⚠️ Produit sans External ID` → Exportez les produits vers Odoo
   - `❌ Impossible de s'authentifier` → Vérifiez `ODOO_USERNAME` et `ODOO_API_KEY`

### Solutions Rapides :

**Problème : Produits sans External ID**
```bash
npm run export-to-odoo
```

**Problème : Variables d'environnement**
- Vérifiez dans Vercel : Settings → Environment Variables
- Toutes les variables Odoo doivent être présentes

## 📝 Checklist Avant Test

- [ ] Variables Odoo configurées dans Vercel
- [ ] Produits exportés vers Odoo (avec External ID)
- [ ] Application déployée sur Vercel
- [ ] Accès à Odoo (https://faata-beach.odoo.com)

---

**Prêt ?** Passez une commande test maintenant ! 🚀

