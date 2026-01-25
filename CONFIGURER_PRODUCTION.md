# 🚀 Configurer et tester en production Railway

## Étape 1 : Trouver votre URL Railway

1. **Allez sur** : https://railway.app
2. **Connectez-vous** à votre compte
3. **Cliquez sur votre projet** (probablement "Mascot")
4. **Cliquez sur le service** (probablement "Mascot" ou "backend")
5. **Allez dans l'onglet "Settings"** (⚙️ Paramètres)
6. **Cherchez "Domains"** ou "Networking"
7. **Copiez l'URL publique** (exemple : `https://mascot-production-abc123.up.railway.app`)

---

## Étape 2 : Configurer tous les fichiers

Une fois que vous avez l'URL, exécutez :

```bash
bash scripts/configure-production.sh https://VOTRE-URL.up.railway.app
```

**Remplacez `VOTRE-URL` par l'URL que vous avez copiée !**

Ce script va :
- ✅ Mettre à jour `figma-plugin/src/api/client.ts`
- ✅ Mettre à jour `figma-plugin/manifest.json`
- ✅ Tester la connexion au backend

---

## Étape 3 : Rebuilder le plugin

```bash
cd figma-plugin
npm run build
```

---

## Étape 4 : Créer un compte et obtenir un token

```bash
bash scripts/create-account-production.sh
```

**OU** si vous voulez spécifier l'URL manuellement :

```bash
bash scripts/create-account-production.sh https://VOTRE-URL.up.railway.app
```

Le script va :
- ✅ Créer un nouveau compte
- ✅ Afficher le token API
- ✅ Sauvegarder le token dans `TOKEN_PRODUCTION_ACTUEL.txt`

---

## Étape 5 : Utiliser le token dans Figma

1. **Ouvrez Figma**
2. **Chargez le plugin Mascot**
3. **Collez le token** dans le champ "API Token"
4. **Cliquez sur "Sign In"**

✅ Vous êtes connecté en production !

---

## 🎯 Résumé rapide

```bash
# 1. Configurer (remplacez l'URL)
bash scripts/configure-production.sh https://VOTRE-URL.up.railway.app

# 2. Rebuilder le plugin
cd figma-plugin && npm run build

# 3. Créer un compte
bash scripts/create-account-production.sh

# 4. Copier le token affiché et l'utiliser dans Figma
```

---

## ❓ Problèmes courants

### "Could not resolve host"
→ L'URL Railway est incorrecte ou le service n'est pas déployé

### "Token non trouvé"
→ Le backend ne répond pas ou il y a une erreur. Vérifiez les logs Railway

### "CORS error"
→ Le domaine n'est pas dans `manifest.json`. Relancez `configure-production.sh`

---

**Quelle est votre URL Railway ? Envoyez-la moi et je peux lancer les commandes pour vous !**
