# 🏗️ Architecture de l'application - FAATA Beach

## Comment fonctionne l'application ?

### 📊 Où sont hébergées les différentes parties ?

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                              │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │              │         │              │             │
│  │  VERCEL      │────────▶│  MONGODB     │             │
│  │  (Frontend   │  API    │  ATLAS       │             │
│  │   + API)     │  Calls  │  (Database)  │             │
│  │              │         │              │             │
│  └──────────────┘         └──────────────┘             │
│       ▲                                                   │
│       │                                                   │
│       │ visite                                           │
│       │                                                   │
│  ┌────┴────┐                                             │
│  │  USER   │                                             │
│  │ Browser │                                             │
│  └─────────┘                                             │
└─────────────────────────────────────────────────────────┘
```

### 1. 🌐 VERCEL (Hébergement de l'application)
- **Frontend React** : Votre interface utilisateur
- **API Serverless Functions** : Votre backend (dossier `api/`)
- **URL** : `https://faata-beach-xxxxx.vercel.app`

### 2. 💾 MONGODB ATLAS (Base de données)
- **Base de données cloud** : Hébergée séparément sur MongoDB Atlas
- **URL de connexion** : `mongodb+srv://...@faatabeach.1d89gut.mongodb.net/...`
- **Pas besoin** de l'héberger sur Vercel !

## 🔗 Comment Vercel se connecte à MongoDB ?

### Configuration avec les variables d'environnement

**Dans Vercel**, vous avez configuré :
- `MONGODB_URI` = l'adresse de votre base MongoDB Atlas
- `JWT_SECRET` = clé secrète pour l'authentification

**Quand l'API s'exécute** :
1. Le code dans `api/lib/mongodb.ts` lit `process.env.MONGODB_URI`
2. Il se connecte à MongoDB Atlas (qui est sur internet, pas sur Vercel)
3. Il récupère les données (catégories, produits, commandes)
4. Il renvoie les données à votre frontend

## ✅ Donc vous n'avez PAS besoin d'héberger MongoDB sur Vercel

**MongoDB Atlas est déjà une base de données cloud séparée !**

C'est comme un restaurant :
- **Vercel** = Le restaurant (où les clients viennent manger)
- **MongoDB Atlas** = L'entrepôt (où les ingrédients sont stockés)
- Le restaurant va chercher les ingrédients à l'entrepôt quand il en a besoin

## ⚠️ Pourquoi l'erreur apparaît alors ?

L'erreur "Une erreur est survenue" peut avoir plusieurs causes :

### 1. 🔒 MongoDB Atlas bloque les connexions
**Problème** : MongoDB Atlas ne permet pas à Vercel de se connecter
**Solution** : Autoriser `0.0.0.0/0` dans Network Access

### 2. ⚙️ Variables d'environnement incorrectes
**Problème** : `MONGODB_URI` n'est pas correctement configuré dans Vercel
**Solution** : Vérifier les variables dans Vercel Dashboard

### 3. 📦 Base de données vide
**Problème** : MongoDB Atlas est vide, pas de catégories/produits
**Solution** : Importer les données avec `npm run import-data`

### 4. 🌐 Problème de connexion réseau
**Problème** : Vercel ne peut pas atteindre MongoDB Atlas
**Solution** : Vérifier Network Access dans MongoDB Atlas

## 🔍 Comment vérifier que tout fonctionne ?

### Test 1 : Vérifier la connexion à l'API
```
https://votre-projet.vercel.app/api/categories
```

**Si ça fonctionne** : Vous verrez `[]` (tableau vide) ou une liste de catégories
**Si ça ne fonctionne pas** : Vous verrez une erreur JSON

### Test 2 : Vérifier MongoDB Atlas
1. Allez sur https://cloud.mongodb.com
2. Collections → Vérifiez si vous avez des catégories
3. Si vide → Importez les données

### Test 3 : Vérifier les logs Vercel
1. Dashboard Vercel → Deployments → Functions
2. Regardez les logs de `/api/categories`
3. Cherchez les erreurs de connexion MongoDB

## 📝 Résumé

✅ **Non, vous n'avez PAS besoin d'héberger MongoDB sur Vercel**
✅ MongoDB Atlas est déjà une base de données cloud séparée
✅ Vercel se connecte à MongoDB Atlas via les variables d'environnement
✅ C'est déjà configuré, il faut juste s'assurer que :
   - MongoDB autorise les connexions depuis Vercel (Network Access)
   - Les variables d'environnement sont correctes dans Vercel
   - Il y a des données dans MongoDB (catégories et produits)

## 🎯 Action immédiate

**L'erreur vient probablement de :**
1. MongoDB Atlas qui bloque les connexions → Configurez Network Access
2. Variables d'environnement incomplètes → Vérifiez dans Vercel
3. Base de données vide → Importez les données

Vérifiez ces 3 points et l'application devrait fonctionner ! 🚀

