# 👥 Comptes Utilisateurs - FAATA Beach

Ce fichier liste tous les comptes utilisateurs de test disponibles dans l'application.

## 🔴 ADMIN

**Email:** `admin@faata.beach`  
**Mot de passe:** `admin123`  
**Rôle:** `admin`  
**Accès:** 
- Dashboard Admin : `/dashboard-admin`
- Accès complet à toutes les fonctionnalités
- Gestion des commandes, produits, réservations
- Statistiques complètes

---

## 🚚 LIVREURS

### Livreur 1

**Email:** `livreur1@faata.beach`  
**Mot de passe:** `livreur123`  
**Rôle:** `delivery`  
**Accès:**
- Dashboard Livreur : `/dashboard-livreur`
- Voir les commandes assignées
- Mettre à jour le statut des livraisons
- Navigation GPS vers les adresses de livraison

### Livreur 2

**Email:** `livreur2@faata.beach`  
**Mot de passe:** `livreur123`  
**Rôle:** `delivery`  
**Accès:**
- Dashboard Livreur : `/dashboard-livreur`
- Voir les commandes assignées
- Mettre à jour le statut des livraisons
- Navigation GPS vers les adresses de livraison

---

## 👤 CLIENT

**Email:** `client@faata.beach`  
**Mot de passe:** `client123`  
**Rôle:** `customer`  
**Accès:**
- Profil Client : `/profile`
- Historique des commandes
- Réservations
- Suivi des commandes en temps réel

---

## 📋 Résumé Rapide

| Rôle | Email | Mot de passe | Dashboard |
|------|-------|--------------|-----------|
| **Admin** | `admin@faata.beach` | `admin123` | `/dashboard-admin` |
| **Livreur 1** | `livreur1@faata.beach` | `livreur123` | `/dashboard-livreur` |
| **Livreur 2** | `livreur2@faata.beach` | `livreur123` | `/dashboard-livreur` |
| **Client** | `client@faata.beach` | `client123` | `/profile` |

---

## 🔄 Création/Recréation des Comptes

Pour créer ou recréer ces comptes dans la base de données, exécutez :

```bash
npm run create-users
```

Ce script va :
- Vérifier si chaque utilisateur existe déjà
- Créer les nouveaux utilisateurs si nécessaire
- Mettre à jour les mots de passe des utilisateurs existants
- Afficher un résumé de tous les comptes créés

---

## 🔐 Sécurité

⚠️ **Important :** Ces comptes sont uniquement pour le développement et les tests.  
En production, utilisez des mots de passe forts et uniques pour chaque utilisateur.

---

## 📝 Notes

- Tous les mots de passe sont stockés de manière sécurisée avec bcryptjs
- Les rôles déterminent les permissions et l'accès aux différentes parties de l'application
- Le script `create-users` peut être exécuté plusieurs fois sans créer de doublons (il met à jour les comptes existants)

