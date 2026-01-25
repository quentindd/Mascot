# 🚀 DÉMARRAGE RAPIDE - Déploiement Railway

## ✅ Tout est prêt !

J'ai préparé :
- ✅ Git initialisé
- ✅ Fichiers nécessaires créés
- ✅ Backend buildé
- ✅ `.gitignore` configuré
- ✅ Script automatique créé

---

## 🎯 3 ÉTAPES SIMPLES

### Étape 1 : Créer le repo GitHub (2 min)

1. **Ouvrez** : https://github.com/new
2. **Nom du repo** : `mascot`
3. **Ne cochez RIEN** (laissez tout vide)
4. Cliquez sur **"Create repository"**

✅ **Repo créé !**

---

### Étape 2 : Pousser le code sur GitHub (1 min)

**Dans un terminal** :

```bash
cd /Users/quentin/Documents/Mascot
./COMMANDES_GITHUB.sh
```

Le script vous demandera votre username GitHub et fera le reste automatiquement.

**OU manuellement** :

```bash
cd /Users/quentin/Documents/Mascot
git remote add origin https://github.com/VOTRE_USERNAME/mascot.git
git branch -M main  
git push -u origin main
```

✅ **Code sur GitHub !**

---

### Étape 3 : Déployer sur Railway (5 min)

#### 3.1 Créer le projet

1. Allez sur : https://railway.app
2. **"Start a New Project"** → Connectez-vous avec GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Choisissez **"mascot"**

Railway commence à builder (2-3 min)...

#### 3.2 Ajouter PostgreSQL

1. **"+ New"** → **"Database"** → **"Add PostgreSQL"**

#### 3.3 Ajouter Redis

1. **"+ New"** → **"Database"** → **"Add Redis"**

#### 3.4 Variables d'environnement

1. Cliquez sur votre service **"backend"**
2. Onglet **"Variables"**
3. **"+ New Variable"** et ajoutez :

```
NODE_ENV = production
PORT = 3000
API_PREFIX = api/v1
JWT_SECRET = CHANGEZ_MOI_AVEC_SECRET_FORT
JWT_EXPIRES_IN = 7d
JWT_REFRESH_SECRET = AUTRE_SECRET_FORT
JWT_REFRESH_EXPIRES_IN = 30d
FRONTEND_URL = https://www.figma.com
FIGMA_PLUGIN_URL = figma://plugin
CREDIT_COST_MASCOT = 1
CREDIT_COST_ANIMATION = 25
CREDIT_COST_LOGO_PACK = 20
```

**Générer des secrets forts** (dans un terminal) :
```bash
openssl rand -base64 32
```

#### 3.5 Générer un domaine

1. **Settings** → **Networking**
2. **"Generate Domain"**
3. **COPIEZ L'URL** : `https://mascot-production-abc123.up.railway.app`

✅ **Backend déployé !**

---

## 📋 Étape 4 : Me donner l'URL Railway

Une fois le déploiement terminé, **donnez-moi l'URL Railway** :

```
https://mascot-production-abc123.up.railway.app
```

Je ferai automatiquement :
- ✅ Mettre à jour le plugin avec votre URL
- ✅ Rebuilder le plugin
- ✅ Créer un compte production
- ✅ Vous donner le token

---

## ⏱️ Temps total : 10 minutes

- GitHub : 2 min
- Railway : 5 min
- Mise à jour plugin : 2 min (moi)
- Test : 1 min

---

## 🎯 COMMENCEZ MAINTENANT

1. **Créez le repo** : https://github.com/new
2. **Exécutez** : `./COMMANDES_GITHUB.sh`
3. **Déployez** : https://railway.app
4. **Donnez-moi l'URL Railway**

C'est parti ! 🚀
