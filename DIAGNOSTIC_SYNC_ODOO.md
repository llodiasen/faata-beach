# 🔍 Diagnostic de la Synchronisation Odoo

## Problème : La commande n'apparaît pas dans Odoo

### ✅ Vérifications à faire

#### 1. Vérifier les variables d'environnement Odoo dans Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet **faata-beach**
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que ces variables sont présentes :
   - ✅ `ODOO_URL` (ex: `https://votre-instance.odoo.com`)
   - ✅ `ODOO_DATABASE` (ex: `faatabeach`)
   - ✅ `ODOO_USERNAME` (ex: `admin`)
   - ✅ `ODOO_API_KEY` (le mot de passe de l'utilisateur Odoo)
5. **IMPORTANT** : Cochez les 3 environnements : Production, Preview, Development
6. **Redéployez** après avoir modifié les variables

#### 2. Vérifier les logs Vercel

1. Allez dans **Deployments** → Sélectionnez le dernier déploiement
2. Cliquez sur **Functions** → `/api/[...path]`
3. Cherchez les logs avec `[Odoo]` dans le nom
4. Copiez-moi les erreurs que vous voyez

**Logs à chercher :**
- `[Odoo] Tentative de synchronisation Odoo...`
- `[Odoo] Configuration Odoo:`
- `[Odoo] ERREUR:` (toute erreur)
- `[Odoo] SUCCESS: Commande Odoo creee avec ID:`

#### 3. Vérifier que les produits ont des IDs Odoo

Exécutez localement :
```bash
npm run check-last-order
```

Cela vous dira si les produits de la dernière commande ont des IDs Odoo.

#### 4. Tester la connexion Odoo

Exécutez localement :
```bash
npm run test-odoo
```

Cela teste la connexion et l'authentification Odoo.

---

## 🔧 Corrections apportées

### Amélioration de la recherche de produits Odoo

J'ai amélioré la fonction `findProductByExternalId` pour :
1. Utiliser `xmlid_to_res_id` (méthode recommandée par Odoo)
2. Essayer plusieurs formats d'external_id en fallback :
   - Format original : `product_template_salade_ni_oise_1`
   - Format avec module : `__export__.product_template_salade_ni_oise_1`
   - Format avec module product : `product.product_template_salade_ni_oise_1`

---

## 📋 Informations à me donner

Pour que je puisse vous aider, donnez-moi :

1. ✅ **Les logs Vercel** : Copiez-moi tous les logs `[Odoo]` de la dernière commande
2. ✅ **Variables d'environnement** : Confirmez que les 4 variables Odoo sont configurées dans Vercel
3. ✅ **Résultat de `npm run check-last-order`** : Les produits ont-ils des IDs Odoo ?
4. ✅ **Résultat de `npm run test-odoo`** : La connexion Odoo fonctionne-t-elle ?

---

## 🚀 Prochaines étapes

1. Vérifiez les variables d'environnement Odoo dans Vercel
2. Redéployez après avoir vérifié les variables
3. Passez une nouvelle commande de test
4. Vérifiez les logs Vercel pour voir les erreurs exactes
5. Partagez-moi les logs pour que je puisse identifier le problème précis

