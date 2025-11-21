# 🔐 Explication : JWT_SECRET

## Qu'est-ce que JWT_SECRET ?

Le `JWT_SECRET` est une **clé secrète** utilisée pour :
- ✅ **Signer** (crypter) les tokens d'authentification des utilisateurs
- ✅ **Vérifier** (décrypter) les tokens quand un utilisateur se connecte
- 🔒 **Sécuriser** l'authentification de votre application

## Comment ça fonctionne ?

Quand un utilisateur se connecte :
1. L'application crée un **token JWT** avec le `JWT_SECRET`
2. Ce token est envoyé au navigateur de l'utilisateur
3. À chaque requête, le token est vérifié avec le même `JWT_SECRET`
4. Si le token correspond, l'utilisateur est authentifié ✅

## Que mettre comme valeur ?

### Option 1 : Utiliser la valeur recommandée (Simple)
```
faata_beach_jwt_secret_2025_changez_en_production
```
✅ **C'est suffisant pour commencer !**

### Option 2 : Générer une valeur plus sécurisée (Optionnel)

Vous pouvez créer une valeur plus complexe avec :
- Des lettres minuscules et majuscules
- Des chiffres
- Des caractères spéciaux
- Au moins 32 caractères

**Exemples** :
```
FaataBeachSecretKey2025!@#$%^&*
ma_super_cle_secrete_faata_beach_2025_tres_longue
Faat@B3@ch#2025$Secret!Key
```

## Où utiliser cette valeur ?

### Sur Vercel (Configuration)
1. Allez dans votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez :
   - **Name** : `JWT_SECRET`
   - **Value** : `faata_beach_jwt_secret_2025_changez_en_production`
   - Cochez : Production, Preview, Development

### Dans le code (Automatique)
Votre code lit automatiquement cette variable depuis Vercel :
```typescript
// Dans api/lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'valeur-par-defaut'
```

## ⚠️ Important

1. **Ne partagez jamais** le JWT_SECRET publiquement
2. **Utilisez la même valeur** sur Vercel que celle que vous avez en local (dans le `.env`)
3. **Pour la production**, vous pouvez changer la valeur pour quelque chose de plus sécurisé (mais ce n'est pas obligatoire)

## 📝 Résumé simple

**Pour Vercel, mettez simplement** :
```
JWT_SECRET = faata_beach_jwt_secret_2025_changez_en_production
```

C'est tout ! ✅ Votre application fonctionnera avec cette valeur.

