# Solution pour l'erreur "Domain is invalid" sur Vercel

## 🔍 Causes possibles

1. **Le domaine est déjà utilisé sur un autre projet Vercel**
2. **Le domaine n'a pas été vérifié comme appartenant à votre compte**
3. **Format du domaine incorrect**
4. **Le domaine est en cours d'utilisation ailleurs**

---

## ✅ Solutions à essayer

### Solution 1 : Vérifier si le domaine est déjà utilisé

1. Aller sur https://vercel.com/dashboard
2. Cliquer sur **Settings** (en haut à droite, icône ⚙️ de votre profil)
3. Aller dans **Domains** dans le menu de gauche
4. Vérifier si `konnectweb.tech` apparaît dans la liste des domaines
5. Si oui, il faut soit :
   - Le retirer de l'autre projet
   - Ou l'ajouter directement depuis cette page de domaine globale

---

### Solution 2 : Ajouter le domaine depuis la page globale Domains

1. Aller sur https://vercel.com/account/domains
2. Cliquer sur **Add Domain**
3. Entrer `konnectweb.tech`
4. Vercel vous guidera pour vérifier la propriété du domaine

---

### Solution 3 : Vérifier le format du domaine

- ✅ Format correct : `konnectweb.tech`
- ❌ Format incorrect : `https://konnectweb.tech` ou `www.konnectweb.tech` (dans le premier champ)

**Important** : Pour ajouter `www.konnectweb.tech`, il faut :
1. D'abord ajouter `konnectweb.tech`
2. Puis ajouter séparément `www.konnectweb.tech`

---

### Solution 4 : Vérifier la propriété du domaine

Si Vercel demande une vérification :

1. Vercel fournira un **code TXT** à ajouter dans les DNS
2. Aller sur Hostinger → **Zone DNS**
3. Ajouter un enregistrement :
   - **Type** : `TXT`
   - **Nom** : `@` ou `_vercel`
   - **Valeur** : Le code fourni par Vercel
   - **TTL** : `3600`
4. Attendre quelques minutes
5. Retourner sur Vercel et cliquer sur "Verify"

---

### Solution 5 : Utiliser Vercel CLI (Alternative)

Si le dashboard ne fonctionne pas, essayez via CLI :

```bash
# Se connecter
vercel login

# Ajouter le domaine au projet
vercel domains add konnectweb.tech --project faata-beach
```

---

## 🔄 Ordre recommandé

1. **D'abord** : Vérifier si le domaine existe déjà dans votre compte Vercel
   - Dashboard → Settings (profil) → Domains
   
2. **Ensuite** : Si le domaine n'existe pas, l'ajouter depuis la page globale
   - https://vercel.com/account/domains → Add Domain

3. **Puis** : Lier le domaine au projet
   - Projet faata-beach → Settings → Domains → Add Domain

4. **Enfin** : Configurer les DNS sur Hostinger selon les instructions Vercel

---

## 📝 Checklist

- [ ] Vérifié si le domaine existe déjà sur Vercel
- [ ] Ajouté le domaine depuis la page globale Domains si nécessaire
- [ ] Vérifié la propriété du domaine (code TXT si demandé)
- [ ] Ajouté le domaine au projet faata-beach
- [ ] Configuré les DNS sur Hostinger

---

## 🆘 Si rien ne fonctionne

1. Vérifier que vous êtes connecté au bon compte Vercel
2. Vérifier les permissions du compte (plan Hobby ou supérieur requis)
3. Contacter le support Vercel si le problème persiste

