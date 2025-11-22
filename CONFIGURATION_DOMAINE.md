# Configuration du domaine konnectweb.tech sur Vercel

## 📋 Étapes à suivre

### 1️⃣ Ajouter le domaine sur Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet **faata-beach**
3. Cliquer sur **Settings** (⚙️ en haut à droite)
4. Dans le menu de gauche, cliquer sur **Domains**
5. Dans le champ "Add Domain", entrer :
   - `konnectweb.tech`
   - `www.konnectweb.tech` (optionnel mais recommandé)
6. Cliquer sur **Add** pour chaque domaine
7. Vercel affichera les enregistrements DNS nécessaires

---

## 🔧 Configuration DNS sur Hostinger

### Option A : Utiliser les Nameservers Vercel (Recommandé)

Cette méthode est la plus simple et la plus fiable.

1. Se connecter à Hostinger : https://hpanel.hostinger.com/
2. Aller dans **Domains** → **Gérer** → **Nameservers**
3. Sélectionner **Use Custom Nameservers**
4. Entrer les nameservers Vercel :
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
5. Cliquer sur **Save**

✅ **Avantages** : Gestion DNS automatique par Vercel, configuration plus simple

---

### Option B : Configurer les enregistrements DNS manuellement

Si vous préférez garder les nameservers Hostinger :

1. Se connecter à Hostinger : https://hpanel.hostinger.com/
2. Aller dans **Domains** → **Zone DNS** (ou **DNS Management**)
3. Vérifier les enregistrements affichés par Vercel dans le dashboard
4. Ajouter/modifier les enregistrements suivants :

#### ⚠️ IMPORTANT : Si le CDN Vercel est activé

Si vous voyez l'erreur "Cannot add A/AAAA record when CDN is enabled", vous **ne pouvez pas utiliser d'enregistrement A**. Utilisez les solutions ci-dessous :

#### Option B1 : Utiliser ALIAS/ANAME pour le domaine racine (si supporté par Hostinger)

- **Type** : `ALIAS` ou `ANAME` (selon ce qui est disponible)
- **Nom** : `@` (ou laisser vide pour le domaine racine)
- **Valeur** : La valeur CNAME affichée par Vercel (généralement `cname.vercel-dns.com.` - notez le point à la fin)
- **TTL** : `3600` (ou Auto)

#### Option B2 : Utiliser uniquement www (si ALIAS non supporté)

Si Hostinger ne supporte pas ALIAS/ANAME, configurez uniquement le sous-domaine www :

- **Type** : `CNAME`
- **Nom** : `www`
- **Valeur** : La valeur CNAME affichée par Vercel (généralement `cname.vercel-dns.com.` - notez le point à la fin)
- **TTL** : `3600` (ou Auto)

**Note** : Pour le domaine racine (konnectweb.tech), utilisez les **nameservers Vercel** (Option A) ou configurez un redirect vers www.

#### ⚠️ Vérifier la valeur CNAME exacte

1. Sur Vercel → Projet → **Settings** → **Domains**
2. Cliquer sur votre domaine
3. Vercel affichera la **valeur CNAME exacte** à utiliser
4. Utiliser **exactement** cette valeur (peut être différente de `cname.vercel-dns.com.`)

5. Supprimer ou modifier les anciens enregistrements A/CNAME qui pourraient entrer en conflit

---

## ⏱️ Propagation DNS

- La propagation DNS peut prendre de **5 minutes à 48 heures**
- Vous pouvez vérifier le statut dans Vercel → Settings → Domains
- Le domaine passera de **Pending** à **Valid Configuration** une fois configuré

---

## 🔍 Vérifier la configuration

1. Aller sur https://vercel.com/dashboard
2. Projet **faata-beach** → **Settings** → **Domains**
3. Vérifier que le statut est **Valid Configuration** (vert)
4. Tester en visitant `https://konnectweb.tech` dans un navigateur

---

## 🌐 SSL/HTTPS

- Vercel fournit automatiquement un certificat SSL gratuit via Let's Encrypt
- HTTPS sera automatiquement activé une fois le domaine connecté
- Aucune configuration supplémentaire nécessaire

---

## 📞 En cas de problème

1. Vérifier que les enregistrements DNS sont corrects sur Hostinger
2. Utiliser un outil comme https://dnschecker.org/ pour vérifier la propagation
3. Vérifier les logs dans Vercel → Settings → Domains
4. S'assurer qu'aucun autre service n'utilise le domaine (ancien hébergement, etc.)

---

## ✅ Checklist

- [ ] Domaine ajouté sur Vercel (konnectweb.tech)
- [ ] Domaine www ajouté sur Vercel (optionnel)
- [ ] Nameservers ou enregistrements DNS configurés sur Hostinger
- [ ] Statut "Valid Configuration" affiché sur Vercel
- [ ] Site accessible via https://konnectweb.tech

