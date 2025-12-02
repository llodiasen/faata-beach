# 💾 Guide de Sauvegarde Vercel

## 📋 Fichiers de sauvegarde créés

### 1. `VERCEL_ENV_BACKUP.md`
Documentation complète de votre configuration Vercel actuelle avec :
- Liste de toutes les variables d'environnement
- Environnements où elles sont configurées
- Instructions de restauration
- Notes de sécurité

### 2. Scripts de sauvegarde automatique

#### Pour Windows (PowerShell)
```powershell
.\scripts\backup-vercel-env.ps1
```

#### Pour Linux/Mac (Bash)
```bash
chmod +x scripts/backup-vercel-env.sh
./scripts/backup-vercel-env.sh
```

#### Via npm (Windows)
```bash
npm run backup:vercel
```

## 🔄 Comment utiliser

### Sauvegarde manuelle (recommandé pour documentation)
Le fichier `VERCEL_ENV_BACKUP.md` contient déjà une sauvegarde complète de votre configuration.

### Sauvegarde automatique via CLI Vercel

1. **Installer Vercel CLI** (si pas déjà fait) :
   ```bash
   npm i -g vercel
   ```

2. **Se connecter** :
   ```bash
   vercel login
   ```

3. **Lier le projet** (si pas déjà fait) :
   ```bash
   vercel link
   ```

4. **Exporter les variables** :
   ```bash
   vercel env ls > backups/vercel-env-export.txt
   ```

   Ou utiliser le script :
   ```bash
   npm run backup:vercel
   ```

## 📊 Résumé de votre configuration actuelle

### Variables globales (All Environments)
- ✅ `MONGODB_URI`
- ✅ `JWT_SECRET`

### Variables Odoo (par environnement)
- ✅ `ODOO_URL` → Development, Preview, Production
- ✅ `ODOO_DATABASE` → Development, Preview, Production
- ✅ `ODOO_USERNAME` → Development, Preview, Production
- ✅ `ODOO_API_KEY` → Development, Preview, Production

**Total** : 14 entrées de variables d'environnement

## 🔍 Vérification

Pour vérifier que tout est bien sauvegardé :

1. Ouvrez `VERCEL_ENV_BACKUP.md` - vous devriez voir toutes vos variables listées
2. Comparez avec votre dashboard Vercel pour confirmer

## ⚠️ Notes importantes

- Les valeurs sensibles (mots de passe, clés API) ne sont **pas** stockées dans les fichiers de sauvegarde pour des raisons de sécurité
- Les backups automatiques sont sauvegardés dans le dossier `backups/` (ignoré par Git)
- Mettez à jour `VERCEL_ENV_BACKUP.md` si vous modifiez des variables sur Vercel

## 🔗 Liens utiles

- **Dashboard Vercel** : https://vercel.com/dashboard
- **Documentation Vercel** : https://vercel.com/docs/concepts/projects/environment-variables

