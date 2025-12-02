# 🔧 Solution : Elementor reste bloqué en chargement

## 🎯 Le problème

Elementor reste bloqué sur l'écran "LOADING" et ne se charge pas.

## ✅ Solutions rapides (dans l'ordre)

### 1. Activer le Safe Mode (Solution immédiate)

1. Cliquez sur le bouton **"Enable Safe Mode"** dans la popup en bas à droite
2. Cela désactive temporairement les plugins/thèmes pour isoler le conflit
3. Si Elementor fonctionne en Safe Mode → Le problème vient d'un plugin/thème

### 2. Vérifier la console du navigateur

1. Appuyez sur **F12** pour ouvrir les outils de développement
2. Allez dans l'onglet **"Console"**
3. Cherchez les erreurs en **rouge**
4. Notez les messages d'erreur (ex: "Failed to load", "404", etc.)

### 3. Augmenter la mémoire PHP

**Via wp-config.php** (si vous avez accès FTP/cPanel) :

```php
// Ajoutez ces lignes AVANT la ligne "/* C'est tout, ne touchez pas à ce qui suit ! */"
define('WP_MEMORY_LIMIT', '512M');
define('WP_MAX_MEMORY_LIMIT', '512M');
```

**Via .htaccess** (alternative) :

```apache
php_value memory_limit 512M
php_value max_execution_time 300
```

### 4. Vider tous les caches

1. **Cache navigateur** : Ctrl+Shift+Delete → Vider le cache
2. **Cache WordPress** : Si vous utilisez un plugin de cache (WP Rocket, W3 Total Cache, etc.) → Videz-le
3. **Cache serveur** : Contactez votre hébergeur pour vider le cache serveur

### 5. Désactiver les plugins en conflit

**Méthode 1 : Via FTP/cPanel**
1. Connectez-vous via FTP ou cPanel File Manager
2. Allez dans `wp-content/plugins/`
3. Renommez temporairement le dossier en `plugins-disabled`
4. Testez Elementor
5. Si ça fonctionne, remettez les plugins un par un pour trouver le conflit

**Méthode 2 : Via le tableau de bord WordPress**
1. Allez dans **Extensions** → **Extensions installées**
2. Désactivez tous les plugins SAUF Elementor
3. Testez Elementor
4. Réactivez les plugins un par un pour trouver le conflit

### 6. Vérifier les permissions des fichiers

Les fichiers WordPress doivent avoir ces permissions :
- **Fichiers** : 644
- **Dossiers** : 755

**Via FTP/cPanel** :
1. Clic droit sur les fichiers/dossiers → Propriétés/Permissions
2. Vérifiez et corrigez si nécessaire

### 7. Mettre à jour Elementor

1. Allez dans **Extensions** → **Extensions installées**
2. Cherchez **Elementor**
3. Si une mise à jour est disponible → Cliquez sur **"Mettre à jour"**

### 8. Tester en navigation privée

1. Ouvrez une fenêtre de navigation privée (Ctrl+Shift+N)
2. Connectez-vous à WordPress
3. Essayez d'ouvrir Elementor

## 🔍 Diagnostic approfondi

### Erreurs JavaScript courantes

**Erreur : "404 Not Found" sur `/wp-json/elementor/v1/*`** ⚠️ VOTRE CAS
→ **C'est votre problème !** Les endpoints REST API d'Elementor ne sont pas accessibles
→ **Solution principale :** Réinitialiser les permalinks (voir `FIX_ELEMENTOR_404_API.md` pour le guide complet)

**Erreur : "Failed to load resource"**
→ Problème de connexion au serveur ou fichier manquant

**Erreur : "CORS" ou "Cross-Origin"**
→ Problème de configuration serveur → Contactez votre hébergeur

**Erreur : "Memory" ou "Timeout"**
→ Augmentez la mémoire PHP (voir solution #3)

**Erreur : "Cannot read properties of undefined (reading 'hasClass')"**
→ Conflit JavaScript → Désactivez les plugins un par un pour trouver le conflit

### Vérifier les logs WordPress

1. Allez dans **Outils** → **Santé du site** (si disponible)
2. Ou vérifiez le fichier `wp-content/debug.log` (si le mode debug est activé)

### Contacter le support

Si rien ne fonctionne :
1. Notez toutes les erreurs de la console (F12)
2. Notez les plugins/thèmes actifs
3. Contactez le support Elementor avec ces informations

## 📋 Checklist de dépannage

- [ ] Safe Mode activé
- [ ] Console vérifiée (F12)
- [ ] Mémoire PHP augmentée
- [ ] Caches vidés
- [ ] Plugins désactivés (test)
- [ ] Permissions vérifiées
- [ ] Elementor mis à jour
- [ ] Test en navigation privée

## 🚀 Solution préventive

Pour éviter ce problème à l'avenir :
1. Gardez Elementor et WordPress à jour
2. Utilisez des plugins/thèmes compatibles
3. Augmentez la mémoire PHP dès le départ
4. Utilisez un plugin de cache optimisé pour Elementor

