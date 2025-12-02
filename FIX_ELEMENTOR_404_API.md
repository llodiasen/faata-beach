# 🔧 Solution : Erreurs 404 API Elementor - Elementor ne charge pas

## 🎯 Le problème identifié

Les erreurs de la console montrent que les endpoints REST API d'Elementor retournent **404 (Not Found)** :

- ❌ `/wp-json/elementor/v1/checklist/user-progress` → 404
- ❌ `/wp-json/elementor/v1/site-navigation/recent-posts` → 404
- ❌ `/wp-json/elementor/v1/kit-elements-defaults` → 404
- ❌ `/wp-json/elementor/v1/globals` → 404

**Cela signifie que l'API REST WordPress n'est pas accessible ou que les routes Elementor ne sont pas enregistrées.**

## ✅ Solutions (dans l'ordre de priorité)

### Solution 1 : Réinitialiser les permalinks WordPress ⚠️ PRIORITÉ 1

**C'est la solution la plus courante pour ce problème !**

1. 🌐 Allez dans votre tableau de bord WordPress
2. 📋 Menu **Réglages** → **Permaliens**
3. 🖱️ **Sans rien modifier**, cliquez simplement sur **"Enregistrer les modifications"**
4. ⏳ Attendez quelques secondes
5. 🔄 Rechargez la page Elementor (F5)

**Pourquoi ça marche ?** Cela régénère le fichier `.htaccess` et réactive les règles de réécriture d'URL nécessaires pour l'API REST.

---

### Solution 2 : Vérifier que l'API REST WordPress fonctionne

**Test rapide :**

Ouvrez cette URL dans votre navigateur :
```
https://wopa.connect-web.tech/wp-json/
```

**✅ Si vous voyez du JSON** (avec des informations sur WordPress) :
→ L'API REST fonctionne, passez à la solution 3

**❌ Si vous voyez une erreur 404 ou une page blanche** :
→ L'API REST est désactivée → Suivez la solution 2B

#### Solution 2B : Réactiver l'API REST

**Via wp-config.php** (si vous avez accès FTP/cPanel) :

1. Ouvrez le fichier `wp-config.php` à la racine de WordPress
2. Cherchez la ligne `/* C'est tout, ne touchez pas à ce qui suit ! */`
3. **AVANT cette ligne**, ajoutez :
```php
// Activer l'API REST
define('REST_REQUEST', true);
```

**Via un plugin** :
1. Installez le plugin **"REST API"** ou **"WP REST API"**
2. Activez-le
3. Testez à nouveau

---

### Solution 3 : Vérifier le fichier .htaccess

**Le fichier `.htaccess` doit contenir les règles de réécriture WordPress.**

1. Connectez-vous via FTP/cPanel
2. Ouvrez le fichier `.htaccess` à la racine de WordPress
3. Vérifiez qu'il contient ces lignes (ou similaires) :

```apache
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
```

**Si le fichier est vide ou manquant :**
1. Créez un nouveau fichier `.htaccess`
2. Copiez le contenu ci-dessus
3. Sauvegardez

**⚠️ Important :** Si vous avez d'autres règles dans `.htaccess`, ajoutez celles-ci **avant** les règles existantes.

---

### Solution 4 : Désactiver les plugins de sécurité qui bloquent l'API REST

**Plugins courants qui peuvent bloquer l'API REST :**
- Wordfence Security
- iThemes Security
- All In One WP Security
- Sucuri Security
- Security plugins

**À faire :**
1. Allez dans **Extensions** → **Extensions installées**
2. Désactivez temporairement votre plugin de sécurité
3. Testez Elementor
4. Si ça fonctionne → Réactivez le plugin et cherchez l'option "Allow REST API" dans ses paramètres

**Pour Wordfence spécifiquement :**
1. Wordfence → **Firewall** → **Options du pare-feu**
2. Cherchez **"Allow REST API"** ou **"Whitelist REST API"**
3. Activez cette option

---

### Solution 5 : Vérifier les permissions du fichier .htaccess

**Les permissions doivent être :**
- **Fichier .htaccess** : 644
- **Dossier racine WordPress** : 755

**Via FTP/cPanel :**
1. Clic droit sur `.htaccess` → Propriétés/Permissions
2. Vérifiez que c'est **644**
3. Si ce n'est pas le cas, modifiez-le

---

### Solution 6 : Réinstaller/réactiver Elementor

**Parfois, les routes API ne sont pas enregistrées correctement.**

1. Allez dans **Extensions** → **Extensions installées**
2. Cherchez **Elementor**
3. Cliquez sur **"Désactiver"**
4. Attendez 5 secondes
5. Cliquez sur **"Activer"**
6. Testez Elementor

**Si ça ne fonctionne pas :**
1. **Désactivez** Elementor
2. **Supprimez** Elementor (⚠️ Ne supprimez PAS les données)
3. **Réinstallez** Elementor depuis le dépôt WordPress
4. **Activez** Elementor
5. Testez

---

### Solution 7 : Vérifier la configuration PHP (mod_rewrite)

**L'extension `mod_rewrite` doit être activée sur votre serveur.**

**Test rapide :**
1. Créez un fichier `test-rewrite.php` à la racine
2. Ajoutez ce code :
```php
<?php
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_rewrite', $modules)) {
        echo "mod_rewrite est activé ✅";
    } else {
        echo "mod_rewrite n'est PAS activé ❌";
    }
} else {
    echo "Impossible de vérifier (peut-être Nginx)";
}
?>
```
3. Ouvrez `https://wopa.connect-web.tech/test-rewrite.php`
4. Si mod_rewrite n'est pas activé → Contactez votre hébergeur

---

### Solution 8 : Vider tous les caches

1. **Cache WordPress** : Si vous utilisez un plugin de cache → Videz-le
2. **Cache navigateur** : Ctrl+Shift+Delete → Vider le cache
3. **Cache serveur** : Contactez votre hébergeur pour vider le cache serveur
4. **Cache opcode PHP** : Si vous avez accès, redémarrez PHP-FPM

---

### Solution 9 : Vérifier la configuration Nginx (si vous utilisez Nginx)

**Si votre serveur utilise Nginx au lieu d'Apache :**

Le fichier de configuration doit contenir :
```nginx
location / {
    try_files $uri $uri/ /index.php?$args;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

**⚠️ Si vous n'avez pas accès à la configuration Nginx :** Contactez votre hébergeur.

---

## 📋 Checklist de dépannage

- [ ] Permalinks réinitialisés (Solution 1)
- [ ] API REST testée (`/wp-json/`) (Solution 2)
- [ ] Fichier `.htaccess` vérifié (Solution 3)
- [ ] Plugins de sécurité désactivés (test) (Solution 4)
- [ ] Permissions `.htaccess` vérifiées (Solution 5)
- [ ] Elementor réactivé (Solution 6)
- [ ] mod_rewrite vérifié (Solution 7)
- [ ] Caches vidés (Solution 8)

## 🚀 Solution la plus probable

**Dans 90% des cas, la Solution 1 (réinitialiser les permalinks) résout le problème.**

Commencez par là !

## 🔍 Test après chaque solution

Après chaque solution, testez :
1. Ouvrez Elementor
2. Vérifiez la console (F12) → Plus d'erreurs 404 ?
3. Si oui → Problème résolu ! ✅
4. Si non → Passez à la solution suivante

## 📞 Si rien ne fonctionne

Si aucune solution ne fonctionne :
1. Notez toutes les erreurs de la console
2. Vérifiez les logs d'erreur WordPress (`wp-content/debug.log`)
3. Contactez votre hébergeur avec ces informations
4. Contactez le support Elementor

