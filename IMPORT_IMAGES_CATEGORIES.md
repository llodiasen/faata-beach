# 🖼️ Import des images des catégories

## ✅ Modifications apportées

1. ✅ **Images ajoutées à chaque catégorie** dans le script `scripts/import-data.ts`
2. ✅ **Vérifié** : CheckoutModal et ConfirmationModal n'affichent pas d'images (seulement formulaire/total)
3. ✅ **Images des produits** : déjà présentes et pertinentes

## 🚀 Pour appliquer les changements

Les modifications sont poussées sur GitHub. Pour appliquer les nouvelles images des catégories :

### Option 1 : Réimporter les données (recommandé)

```bash
cd C:\Users\wopal\Desktop\faata-beach
npm run import-data
```

Cela va :
- ✅ Supprimer les anciennes catégories et produits
- ✅ Créer les nouvelles catégories **avec images**
- ✅ Créer tous les produits avec leurs images

### Option 2 : Mettre à jour uniquement les catégories

Si vous ne voulez pas supprimer les produits existants, vous pouvez :
1. Aller sur MongoDB Atlas
2. Collections → `categories`
3. Pour chaque catégorie, ajouter manuellement le champ `imageUrl`

## 📋 Images des catégories

Voici les images ajoutées pour chaque catégorie :

- **Boissons** : Cocktail/boisson tropicale
- **Snacks & Tapas** : Frites/tapas
- **Burgers** : Burger
- **Plats Mer** : Poisson grillé
- **Plats Terre** : Poulet curry
- **Pizzas** : Pizza
- **Sandwichs & Wraps** : Wrap
- **Desserts** : Glace
- **Menu Enfant** : Nuggets/kids meal

## ✅ Vérification

Après avoir réimporté les données, vérifiez que :
1. ✅ Les catégories s'affichent avec leurs images dans la modal des catégories
2. ✅ Les produits s'affichent avec leurs images
3. ✅ CheckoutModal n'affiche pas d'images (seulement formulaire)
4. ✅ ConfirmationModal n'affiche pas d'images (seulement message de confirmation)

