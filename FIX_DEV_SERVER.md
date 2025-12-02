# 🔧 Correction du serveur de développement

## ❌ Problème
Les routes API ne fonctionnaient pas en développement local car `dev-server.mjs` pointait vers les anciens emplacements des handlers.

## ✅ Solution appliquée
Mise à jour de `dev-server.mjs` pour pointer vers les nouveaux fichiers de routage dans `api/` :
- `./api/auth.ts` (au lieu de `./api/auth/[action].ts`)
- `./api/products.ts`
- `./api/categories.ts`
- `./api/orders.ts`
- `./api/reservations.ts`
- `./api/push.ts`
- `./api/users/[action].ts`

## 🚀 Redémarrer le serveur

Pour que les changements prennent effet, redémarrez le serveur de développement :

```bash
npm run dev
```

Les routes API devraient maintenant fonctionner correctement en local.

