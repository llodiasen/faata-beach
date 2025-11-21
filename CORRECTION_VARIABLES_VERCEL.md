# 🔧 Correction des variables d'environnement Vercel

## ❌ Problème détecté

Vous avez un **espace avant `JWT_SECRET`** :
```
JWT_SECRET:     faata_beach_jwt_secret_2025_changez_en_production
                  ^^^ (espaces ici - À SUPPRIMER)
```

**Les espaces avant les valeurs peuvent causer des erreurs !**

## ✅ Solution : Corriger JWT_SECRET

### Étape 1 : Supprimer JWT_SECRET avec espaces

1. 🌐 Dans la page Vercel que vous avez ouverte
2. 👁️ Trouvez la ligne avec **`JWT_SECRET`**
3. 🗑️ Cliquez sur l'icône **Delete** (icône de poubelle/trash) à côté de `JWT_SECRET`
4. ✅ Confirmez la suppression

### Étape 2 : Ajouter JWT_SECRET sans espaces

1. ➕ Cliquez sur **"+ Add Another"** (si vous n'avez pas d'autres lignes) ou ajoutez dans le champ vide
2. **Key** : `JWT_SECRET`
   - ⚠️ **IMPORTANT** : Aucun espace avant ou après
   - ✅ Doit être exactement : `JWT_SECRET`
3. **Value** : `faata_beach_jwt_secret_2025_changez_en_production`
   - ⚠️ **IMPORTANT** : Aucun espace avant ou après
   - ✅ Doit être exactement : `faata_beach_jwt_secret_2025_changez_en_production`
   - ❌ **NE PAS mettre** : `     faata_beach_jwt_secret_2025_changez_en_production` (avec espaces)

### Étape 3 : Vérifier MONGODB_URI

**Votre `MONGODB_URI` est correcte** :
```
mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
```

✅ Pas d'espaces avant ou après
✅ Valeur complète (du début à la fin)
✅ Commence par `mongodb+srv://`
✅ Fini par `?retryWrites=true&w=majority`

### Étape 4 : Vérifier les environnements

**Important** : Assurez-vous que les variables sont disponibles pour tous les environnements :

1. 👁️ Regardez le dropdown **"All Environments"** en haut de la page
2. ✅ Si c'est réglé sur **"All Environments"** → C'est parfait !
3. ❌ Si c'est réglé sur autre chose → Cliquez dessus et sélectionnez **"All Environments"**

**OU** pour chaque variable individuellement :
1. Pour chaque variable (`MONGODB_URI` et `JWT_SECRET`)
2. Regardez s'il y a des checkboxes pour les environnements
3. ✅ Cochez les 3 :
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

### Étape 5 : Sauvegarder

1. 💾 Cliquez sur le bouton **"Save"** en bas à droite
2. ⏳ Attendez la confirmation

### Étape 6 : Redéployer

**Important** : Après avoir modifié les variables d'environnement, vous devez redéployer :

1. 📋 Allez dans **Deployments** (menu de gauche)
2. 👁️ Trouvez le **dernier déploiement**
3. 🖱️ Cliquez sur les **"..."** (3 points) à côté du déploiement
4. 🔄 Cliquez sur **"Redeploy"**
5. ✅ Confirmez le redéploiement
6. ⏳ Attendez 2-3 minutes

---

## ✅ Vérification finale

Vos variables devraient ressembler exactement à ça :

### MONGODB_URI
```
Key:   MONGODB_URI
Value: mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
```

### JWT_SECRET
```
Key:   JWT_SECRET
Value: faata_beach_jwt_secret_2025_changez_en_production
```

**⚠️ Aucun espace avant ou après les valeurs !**

---

## 🎯 Après correction

1. ✅ Supprimez les espaces de `JWT_SECRET`
2. ✅ Ajoutez `JWT_SECRET` sans espaces
3. ✅ Vérifiez que les 3 environnements sont cochés
4. ✅ Sauvegardez
5. ✅ Redéployez

Ensuite, testez à nouveau :
- `https://faata-beach.vercel.app/api/categories`
- Votre application

**L'erreur 500 devrait disparaître !** 🎉

---

## 📋 Checklist

- [ ] ✅ `MONGODB_URI` existe et est complète (sans espaces)
- [ ] ✅ `JWT_SECRET` a été supprimé (l'ancienne avec espaces)
- [ ] ✅ `JWT_SECRET` a été ajouté à nouveau (sans espaces)
- [ ] ✅ Les 3 environnements sont cochés (Production, Preview, Development)
- [ ] ✅ Sauvegardé
- [ ] ✅ Redéployé

---

## 🆘 Si ça ne fonctionne toujours pas

Après avoir corrigé `JWT_SECRET` et redéployé, vérifiez aussi :

1. **MongoDB Network Access** : `0.0.0.0/0` est configuré ?
2. **Logs Vercel** : Quelles erreurs voyez-vous après redéploiement ?

Dites-moi si l'erreur persiste après avoir corrigé les espaces ! 🎯

