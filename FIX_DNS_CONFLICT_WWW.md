# Résolution : Erreur "DNS resource record conflicts" pour www

## 🔍 Causes possibles du conflit

1. **Un enregistrement A ou CNAME existe déjà pour www**
2. **Un enregistrement wildcard (*) entre en conflit**
3. **La valeur CNAME est incorrecte ou a un format invalide**

---

## ✅ Solution : Vérifier et nettoyer les enregistrements existants

### Étape 1 : Vérifier les enregistrements existants pour www

Sur Hostinger → **Zone DNS**, vérifiez s'il existe **déjà** :

- ❌ Un enregistrement **A** pour `www` → **SUPPRIMER**
- ❌ Un enregistrement **CNAME** pour `www` → **SUPPRIMER ou MODIFIER**
- ❌ Un enregistrement **wildcard** (`*`) → Peut entrer en conflit

### Étape 2 : Supprimer les enregistrements en conflit

1. Trouver tous les enregistrements avec le nom `www`
2. Les **supprimer** tous
3. Attendre 2-3 minutes pour la propagation

### Étape 3 : Ajouter le CNAME correct

Après avoir supprimé les anciens enregistrements :

1. **Type** : `CNAME`
2. **Name** : `www` (sans le point, juste `www`)
3. **Target** : `cname.vercel-dns.com.` (avec le point final)
4. **TTL** : `14400` ou `3600`

---

## 🔍 Vérification de la valeur exacte sur Vercel

Il est **crucial** de vérifier la valeur CNAME exacte sur Vercel :

1. Aller sur **Vercel Dashboard** → Projet **faata-beach**
2. **Settings** → **Domains**
3. Cliquer sur le domaine `konnectweb.tech`
4. Vercel affichera **la valeur exacte** à utiliser
5. Elle peut être différente de `cname.vercel-dns.com.`

**Exemples de valeurs possibles** :
- `cname.vercel-dns.com.`
- `cname.vercel-dns.com`
- `76.76.21.21.nip.io` (si CDN activé)
- Autre valeur spécifique à votre compte

**Utilisez EXACTEMENT la valeur affichée par Vercel**

---

## 📝 Configuration finale attendue

Après nettoyage, vous devriez avoir :

```
✅ ALIAS  |  @  |  cname.vercel-dns.com  |  14400
✅ CNAME  |  www  |  cname.vercel-dns.com.  |  14400
```

**ATTENTION** : La valeur peut être différente - utilisez celle affichée par Vercel !

---

## ⚠️ Points importants

1. **Pas de point dans le champ "Name"** : Utilisez juste `www`, pas `www.` ou `www.konnectweb.tech`
2. **Point final dans "Target"** : `cname.vercel-dns.com.` (avec le point)
3. **Vérifier la valeur exacte** sur Vercel avant d'ajouter
4. **Supprimer tous les anciens enregistrements** pour www avant d'en ajouter un nouveau

---

## 🔄 Alternative : Ne pas utiliser www

Si vous continuez à avoir des problèmes avec www :

1. **Ne configurez que l'ALIAS** pour `@` (konnectweb.tech)
2. Sur Vercel, configurez une **redirection automatique** de www vers le domaine racine
3. Ou laissez www non configuré pour l'instant

---

## ✅ Checklist de résolution

- [ ] Supprimé tous les enregistrements existants pour `www`
- [ ] Vérifié la valeur CNAME exacte sur Vercel
- [ ] Ajouté le CNAME avec la valeur exacte de Vercel
- [ ] Vérifié qu'il n'y a pas de wildcard (`*`) qui entre en conflit
- [ ] Attendu 5-10 minutes pour la propagation DNS

---

## 🆘 Si le problème persiste

1. **Utiliser les nameservers Vercel** (Option A) - C'est la solution la plus simple
2. **Contacter le support Hostinger** pour vérifier s'il y a des restrictions
3. **Vérifier sur Vercel** si le domaine est correctement configuré

