# 🔧 Corriger l'erreur Railway

## Problème

Railway affiche : **"Error creating build plan with Railpack"**

**Cause** : Railway ne trouve pas le backend car il est dans le sous-dossier `backend/` et non à la racine.

---

## ✅ Solution appliquée

J'ai créé un fichier `nixpacks.toml` qui indique à Railway où se trouve le backend.

**Fichier créé** : `/nixpacks.toml`

Ce fichier dit à Railway :
- Le backend est dans `backend/`
- Utiliser Node.js 20
- Exécuter `npm ci`, `npm run build`, et `npm run start:prod` dans ce dossier

---

## 📋 Actions à faire MAINTENANT

### 1. Railway va redéployer automatiquement

Dès que j'ai pushé le code, Railway détecte le changement et redéploie.

**Vérifiez dans Railway** :
- Un nouveau déploiement devrait apparaître
- Status : "Building..."

### 2. Attendez le build (2-3 min)

Le build devrait maintenant réussir !

**Dans les logs, vous verrez** :
```
✓ Initialization
✓ Build > Build image
✓ Deploy
```

---

## ⚠️ Si ça échoue encore

### Vérifier les logs

Cliquez sur **"View logs"** dans Railway et cherchez l'erreur exacte.

### Alternative : Configuration Railway UI

Si le fichier `nixpacks.toml` ne suffit pas :

1. Dans Railway, allez dans votre service **"backend"**
2. **Settings** → **Build**
3. Ajoutez ces configurations :

**Root Directory** : `backend`
**Install Command** : `npm ci`
**Build Command** : `npm run build`  
**Start Command** : `npm run start:prod`

---

## 🎯 Prochaines étapes

Une fois le build réussi :

1. ✅ Ajouter PostgreSQL (+ New → Database → PostgreSQL)
2. ✅ Ajouter Redis (+ New → Database → Redis)
3. ✅ Configurer les variables d'environnement
4. ✅ Générer un domaine
5. ✅ Me donner l'URL

---

## 🔍 Vérifier le nouveau déploiement

Dans Railway, vous devriez voir :
- Un nouveau commit : "Fix: Add nixpacks.toml for Railway deployment"
- Status qui passe de "Building..." à "Success"
- Les logs montrent : `🚀 Mascot API is running on...`

**Attendez 2-3 minutes** et dites-moi si ça fonctionne ! 🚀
