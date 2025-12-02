# 🔧 Instructions pour corriger le problème des produits

## ❌ Problème identifié
Le service worker intercepte les requêtes API et cause des erreurs `net::ERR_FAILED`.

## ✅ Solutions appliquées

1. **Service worker désactivé en développement** dans `vite.config.ts`
2. **Service worker amélioré** pour mieux gérer les routes API

## 🚀 Étapes pour corriger

### 1. Désactiver le service worker dans le navigateur

1. Ouvrez les **DevTools** (F12)
2. Allez dans l'onglet **Application** (ou **Applications**)
3. Dans le menu de gauche, cliquez sur **Service Workers**
4. Trouvez le service worker actif et cliquez sur **Unregister** (ou **Désinscrire**)
5. Rafraîchissez la page (Ctrl+Shift+R pour vider le cache)

### 2. Redémarrer le serveur de développement

1. Arrêtez le serveur actuel (Ctrl+C dans le terminal)
2. Redémarrez-le :
   ```bash
   npm run dev
   ```

### 3. Vérifier que les routes API fonctionnent

Ouvrez la console du navigateur et vérifiez qu'il n'y a plus d'erreurs `net::ERR_FAILED` pour `/api/categories` et `/api/products`.

## 📝 Note

Le service worker est maintenant **désactivé en développement** pour éviter les conflits avec les routes API. Il sera actif uniquement en production sur Vercel.

## ✅ Résultat attendu

Après ces étapes, les produits et catégories devraient se charger correctement dans la page `/menu`.

