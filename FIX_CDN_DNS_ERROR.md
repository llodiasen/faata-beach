# Solution : Erreur "Cannot add A/AAAA record when CDN is enabled"

## 🔍 Explication du problème

Quand Vercel active le CDN (Content Delivery Network) pour votre domaine, vous **ne pouvez pas utiliser d'enregistrements A/AAAA**. Il faut utiliser des **CNAME** à la place.

Le CDN de Vercel utilise des noms de domaine dynamiques, donc il faut pointer vers un CNAME plutôt qu'une IP fixe.

---

## ✅ Solution : Utiliser des CNAME au lieu de A/AAAA

### Pour le domaine racine (konnectweb.tech)

**Problème** : Les domaines racines ne peuvent normalement pas utiliser CNAME selon les standards DNS.

**Solution Vercel** : Utiliser un **ALIAS** ou **ANAME** (si supporté par Hostinger) ou utiliser le **CNAME flattening** de Vercel.

### Configuration sur Hostinger

#### Option 1 : Si Hostinger supporte ALIAS/ANAME (Recommandé)

1. Aller sur Hostinger → **Zone DNS**
2. **Supprimer** l'enregistrement A existant pour `@`
3. Ajouter un enregistrement :
   - **Type** : `ALIAS` ou `ANAME` (selon ce qui est disponible)
   - **Nom** : `@` (ou laisser vide)
   - **Valeur** : `cname.vercel-dns.com.` (notez le point à la fin)
   - **TTL** : `3600`

#### Option 2 : Utiliser les nameservers Vercel (Plus simple)

Si Hostinger ne supporte pas ALIAS/ANAME, la **meilleure solution** est d'utiliser les nameservers Vercel :

1. Sur Hostinger → **Domains** → **Gérer** → **Nameservers**
2. Sélectionner **Use Custom Nameservers**
3. Entrer :
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
4. Sauvegarder

✅ **Avantage** : Vercel gère automatiquement tous les enregistrements, y compris le CDN

#### Option 3 : CNAME pour www uniquement

Si vous ne pouvez pas utiliser ALIAS pour le domaine racine :

1. **Pour www.konnectweb.tech** :
   - **Type** : `CNAME`
   - **Nom** : `www`
   - **Valeur** : `cname.vercel-dns.com.` (avec le point)
   - **TTL** : `3600`

2. **Pour konnectweb.tech** (domaine racine) :
   - Utiliser les **nameservers Vercel** (Option 2 ci-dessus)
   - OU utiliser un **redirect** de konnectweb.tech vers www.konnectweb.tech

---

## 🔧 Configuration complète recommandée

### Méthode 1 : Nameservers Vercel (RECOMMANDÉ)

```
Sur Hostinger :
1. Nameservers → ns1.vercel-dns.com, ns2.vercel-dns.com
2. C'est tout ! Vercel gère le reste automatiquement
```

### Méthode 2 : DNS manuels avec CNAME

```
Sur Hostinger → Zone DNS :

1. Pour www.konnectweb.tech :
   - Type : CNAME
   - Nom : www
   - Valeur : cname.vercel-dns.com.
   - TTL : 3600

2. Pour konnectweb.tech (si ALIAS supporté) :
   - Type : ALIAS
   - Nom : @
   - Valeur : cname.vercel-dns.com.
   - TTL : 3600

3. Si ALIAS non supporté :
   → Utiliser les nameservers Vercel (Méthode 1)
```

---

## 📝 Vérifier la valeur CNAME exacte sur Vercel

1. Aller sur Vercel → Projet **faata-beach** → **Settings** → **Domains**
2. Cliquer sur le domaine `konnectweb.tech`
3. Vercel affichera la **valeur CNAME exacte** à utiliser
4. Elle peut être différente de `cname.vercel-dns.com.`
5. Utiliser **exactement** la valeur affichée par Vercel

---

## ⚠️ Points importants

1. **Ne pas utiliser d'enregistrement A** quand le CDN est activé
2. **Utiliser CNAME ou ALIAS** à la place
3. **Vérifier la valeur exacte** sur Vercel (peut varier)
4. **Le point final** dans `cname.vercel-dns.com.` est important
5. **Les nameservers Vercel** résolvent automatiquement ce problème

---

## ✅ Checklist

- [ ] Vérifié que le CDN est activé sur Vercel
- [ ] Supprimé les enregistrements A/AAAA existants
- [ ] Utilisé CNAME/ALIAS au lieu de A/AAAA
- [ ] Vérifié la valeur CNAME exacte sur Vercel
- [ ] Configuré les DNS sur Hostinger
- [ ] Attendu la propagation DNS (5 min - 48h)

---

## 🎯 Solution rapide

**Pour éviter tous ces problèmes** : Utilisez les **nameservers Vercel** (Option A). C'est la solution la plus simple et elle fonctionne toujours, même avec le CDN activé.

