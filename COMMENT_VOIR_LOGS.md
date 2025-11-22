# 📋 Guide : Comment voir les logs

## 🔍 Pour diagnostiquer l'erreur bcrypt

### 1️⃣ **Logs du Serveur** (LE PLUS IMPORTANT)

**Où :** Terminal où vous avez lancé `npm run dev`

**Comment :**
1. Trouvez le terminal où tourne votre serveur
2. Regardez les messages qui apparaissent quand vous essayez de vous connecter
3. Cherchez les logs qui commencent par `[bcrypt]` ou `[login]`

**Exemple de ce que vous devriez voir :**
```
🚀 Serveur de développement démarré sur http://localhost:5173
📡 API disponible sur http://localhost:5173/api

[bcrypt] Starting to load bcryptjs...
[bcrypt] ✅ Successfully loaded using createRequire
[login] About to compare password for user: admin@faata.beach
[login] Password comparison result: true
```

**Si vous voyez des erreurs :**
```
[bcrypt] ❌ All methods failed to load bcryptjs
[bcrypt] Error: ...
[login] Error during password comparison: ...
```

➡️ **Copiez-moi TOUS ces logs** pour que je puisse diagnostiquer le problème !

---

### 2️⃣ **Console du Navigateur** (erreurs réseau)

**Où :** Dans votre navigateur (Chrome, Firefox, etc.)

**Comment :**
1. Ouvrez votre site : http://localhost:5173
2. Appuyez sur **F12** (ou clic droit → Inspecter)
3. Cliquez sur l'onglet **Console**
4. Essayez de vous connecter
5. Regardez les erreurs rouges qui apparaissent

**Exemple de ce que vous verrez :**
```
[API] Fetching: /api/auth/login
POST http://localhost:5173/api/auth/login 500 (Internal Server Error)
[API] Error response: {message: 'bcrypt.compare is not a function'}
```

➡️ Ces logs sont utiles mais **moins importants** que les logs du serveur.

---

## ✅ Checklist pour déboguer

1. ☑️ Vérifiez que le serveur tourne (`npm run dev` est lancé)
2. ☑️ Ouvrez le terminal du serveur
3. ☑️ Ouvrez la console du navigateur (F12)
4. ☑️ Essayez de vous connecter
5. ☑️ Regardez **LES DEUX** consoles en même temps
6. ☑️ Copiez-moi les logs qui commencent par `[bcrypt]` ou `[login]`

---

## 🎯 Ce qu'on cherche

**Dans le terminal du serveur :**
- `[bcrypt] ✅ Successfully loaded...` = ✅ Ça fonctionne !
- `[bcrypt] ❌ Failed to load...` = ❌ Problème de chargement
- `[login] Error during password comparison` = ❌ Erreur lors de la comparaison

**Dans la console du navigateur :**
- `500 Internal Server Error` = Le serveur a crashé
- `{message: 'bcrypt.compare is not a function'}` = L'erreur exacte

---

## 📸 Capture d'écran recommandée

Prenez une capture d'écran du **terminal du serveur** quand vous essayez de vous connecter, c'est la meilleure façon de me montrer ce qui se passe !

