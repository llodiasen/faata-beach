# TODO - FAATA Beach

## 🔴 PRIORITÉ HAUTE - Bloquant pour la mise en production

### Assets manquants
- [ ] **Créer les icônes PWA**
  - [ ] Créer `public/icons/icon-192x192.png` (192x192 pixels)
  - [ ] Créer `public/icons/icon-512x512.png` (512x512 pixels)
  - ⚠️ **Bloquant** : Sans ces icônes, la PWA ne peut pas être installée correctement

- [ ] **Ajouter l'image de fond Hero**
  - [ ] Créer/ajouter `public/images/hero-beach-food.jpg`
  - [ ] Optimiser l'image (format WebP recommandé, taille < 500KB)
  - ⚠️ **Important** : La page d'accueil affichera une image manquante sans cela

- [ ] **Créer/Ajouter un favicon**
  - [ ] Créer `public/favicon.ico` ou `public/vite.svg`
  - [ ] Mettre à jour `index.html` si nécessaire

### Configuration
- [ ] **Créer le fichier `.env` local**
  - [ ] Créer `.env` à la racine du projet
  - [ ] Ajouter les variables d'environnement :
    ```env
    MONGODB_URI=mongodb+srv://wopallodia92:faatabeach2K25@faatabeach.1d89gut.mongodb.net/faata-beach?retryWrites=true&w=majority
    JWT_SECRET=faata_beach_jwt_secret_2025_changez_en_production
    VITE_API_URL=/api
    ```
  - ⚠️ **Bloquant** : Sans `.env`, l'application ne peut pas se connecter à MongoDB en local

---

## 🟡 PRIORITÉ MOYENNE - Fonctionnalités importantes

### Fonctionnalités manquantes
- [ ] **Implémenter l'historique des commandes**
  - [ ] Créer un composant `OrderHistoryModal.tsx` dans `src/components/modals/`
  - [ ] Créer une page ou une section pour afficher l'historique
  - [ ] Ajouter un bouton "Mes commandes" dans le Header (visible uniquement si utilisateur connecté)
  - [ ] Implémenter l'affichage des commandes avec :
    - Date de commande
    - Statut (pending, confirmed, preparing, ready, completed)
    - Total
    - Liste des produits
  - [ ] Ajouter un filtre par statut
  - [ ] Ajouter la possibilité de voir les détails d'une commande

- [ ] **Améliorer la gestion des erreurs réseau**
  - [ ] Créer un composant `ErrorNotification.tsx` pour afficher les erreurs globales
  - [ ] Implémenter un système de retry automatique pour les requêtes API échouées
  - [ ] Ajouter un toast/notification pour les erreurs utilisateur
  - [ ] Gérer les erreurs de connexion (mode offline)

- [ ] **Améliorer la validation des formulaires**
  - [ ] Valider le format email avec regex
  - [ ] Valider le format téléphone (format français)
  - [ ] Ajouter des messages d'erreur plus précis et clairs
  - [ ] Valider les champs obligatoires visuellement

### Base de données
- [ ] **Insérer des données de test dans MongoDB**
  - [ ] Créer au moins 3 catégories (ex: Plats principaux, Boissons, Desserts)
  - [ ] Créer 5-10 produits par catégorie avec :
    - Nom, description, prix, imageUrl (optionnel)
    - isAvailable: true
    - displayOrder configuré
  - [ ] (Optionnel) Créer un utilisateur de test

---

## 🟢 PRIORITÉ BASSE - Améliorations et optimisations

### UX/UI
- [ ] **Améliorer l'accessibilité**
  - [ ] Ajouter des attributs ARIA manquants sur les boutons et modales
  - [ ] Implémenter la navigation au clavier complète
  - [ ] Ajouter des labels pour les lecteurs d'écran
  - [ ] Tester avec un lecteur d'écran

- [ ] **Optimiser les performances**
  - [ ] Ajouter le lazy loading pour les images de produits
  - [ ] Implémenter la pagination pour les listes de produits (si beaucoup de produits)
  - [ ] Ajouter le code splitting pour réduire la taille du bundle initial
  - [ ] Optimiser les images (WebP, compression)

- [ ] **Améliorer l'expérience mobile**
  - [ ] Tester sur différents appareils mobiles
  - [ ] Optimiser les tailles de boutons pour le tactile
  - [ ] Ajouter des gestes swipe si nécessaire

### Tests
- [ ] **Ajouter des tests unitaires**
  - [ ] Tester les stores Zustand (useAuthStore, useCartStore, useModalStore)
  - [ ] Tester les fonctions utilitaires
  - [ ] Tester les composants UI (Button, Modal)

- [ ] **Ajouter des tests d'intégration**
  - [ ] Tester le flux complet de commande
  - [ ] Tester l'authentification
  - [ ] Tester la gestion du panier

### Documentation
- [ ] **Améliorer la documentation du code**
  - [ ] Ajouter des commentaires JSDoc aux fonctions API
  - [ ] Documenter les composants principaux
  - [ ] Documenter les stores Zustand

- [ ] **Créer une documentation API**
  - [ ] Documenter tous les endpoints API
  - [ ] Ajouter des exemples de requêtes/réponses
  - [ ] Documenter les codes d'erreur

---

## ⚙️ CONFIGURATION PRODUCTION

### Pré-déploiement Vercel
- [ ] **Configurer MongoDB Atlas pour la production**
  - [ ] Vérifier que Network Access autorise `0.0.0.0/0` ou les IPs Vercel
  - [ ] Vérifier que l'utilisateur de base de données a les bonnes permissions

- [ ] **Configurer les variables d'environnement dans Vercel**
  - [ ] Ajouter `MONGODB_URI` dans Vercel (Settings > Environment Variables)
  - [ ] Ajouter `JWT_SECRET` avec une valeur sécurisée aléatoire (générer avec `openssl rand -base64 32`)
  - [ ] Configurer pour Production, Preview et Development

- [ ] **Vérifier la configuration PWA**
  - [ ] Tester l'installation PWA sur mobile
  - [ ] Vérifier que le Service Worker fonctionne
  - [ ] Tester le mode offline

### Sécurité
- [ ] **Renforcer la sécurité**
  - [ ] Changer le JWT_SECRET par défaut en production
  - [ ] Ajouter rate limiting sur les endpoints API si nécessaire
  - [ ] Vérifier que les mots de passe sont bien hashés (déjà fait avec bcrypt)
  - [ ] Valider et sanitizer les inputs côté serveur

---

## 🔍 VÉRIFICATIONS FINALES

### Tests fonctionnels
- [ ] **Tester le flux complet utilisateur**
  - [ ] S'inscrire / Se connecter
  - [ ] Parcourir les catégories
  - [ ] Voir les produits d'une catégorie
  - [ ] Voir les détails d'un produit
  - [ ] Ajouter des produits au panier
  - [ ] Modifier les quantités dans le panier
  - [ ] Finaliser une commande (sur place et emporter)
  - [ ] Recevoir la confirmation de commande

- [ ] **Tester les cas d'erreur**
  - [ ] Connexion avec mauvais identifiants
  - [ ] Produit indisponible
  - [ ] Panier vide
  - [ ] Erreur de connexion réseau
  - [ ] Token expiré

### Tests de performance
- [ ] Tester le temps de chargement initial
- [ ] Tester sur connexion lente (3G)
- [ ] Vérifier que les images se chargent correctement

---

## 📝 NOTES

### Dépendances manquantes potentielles
- Vérifier que `zustand/middleware` est bien inclus dans le package.json (pour `persist`)
- S'assurer que tous les packages sont à jour

### Points d'attention
- Le fichier `.env` ne doit JAMAIS être commité (déjà dans `.gitignore`)
- Les credentials MongoDB dans `CONFIG.md` sont exposés - les changer en production
- Le JWT_SECRET par défaut doit être changé en production

---

## ✅ STATUT

- **Total des tâches** : ~30 tâches
- **Priorité haute** : 4 tâches (bloquantes)
- **Priorité moyenne** : 4 tâches (importantes)
- **Priorité basse** : ~10 tâches (améliorations)
- **Configuration** : 5 tâches (production)

**Prochaine étape recommandée** : Commencer par les tâches de priorité haute (assets et configuration `.env`)

