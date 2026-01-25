# 🚀 Déploiement Railway - Actions à faire MAINTENANT

## ✅ Ce qui est préparé

- ✅ `.gitignore` créé
- ✅ `railway.json` créé
- ✅ `README.md` créé
- ✅ Backend buildé
- ✅ Git initialisé

---

## 📋 Étape 1 : Créer un repo GitHub (2 min)

### 1.1 Créer le repo sur GitHub

1. Allez sur : https://github.com/new
2. **Repository name** : `mascot`
3. **Description** : `AI Mascot Generator - Figma Plugin`
4. **Public** ou **Private** : À vous de choisir
5. **Ne cochez RIEN** (pas de README, pas de .gitignore, pas de licence)
6. Cliquez sur **"Create repository"**

### 1.2 Pousser le code

GitHub vous affiche des commandes. **Utilisez la deuxième section** :

```bash
cd /Users/quentin/Documents/Mascot
git remote add origin https://github.com/VOTRE_USERNAME/mascot.git
git branch -M main
git push -u origin main
```

**Remplacez `VOTRE_USERNAME`** par votre username GitHub !

✅ **Code sur GitHub !**

---

## 📋 Étape 2 : Déployer sur Railway (5 min)

### 2.1 Créer un compte Railway

1. Allez sur : https://railway.app
2. Cliquez sur **"Start a New Project"**
3. Connectez-vous avec **GitHub**
4. Autorisez Railway

### 2.2 Créer le projet

1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez **"mascot"**
4. Railway détecte automatiquement le backend

⏱️ Railway commence à builder... (2-3 minutes)

### 2.3 Ajouter PostgreSQL

1. Dans le projet, cliquez sur **"+ New"**
2. **"Database"** → **"Add PostgreSQL"**
3. Railway crée automatiquement `DATABASE_URL`

### 2.4 Ajouter Redis

1. Cliquez sur **"+ New"**
2. **"Database"** → **"Add Redis"**  
3. Railway crée automatiquement les variables Redis

### 2.5 Configurer les variables d'environnement

1. Cliquez sur votre service **"backend"**
2. Onglet **"Variables"**
3. Ajoutez :

```
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

JWT_SECRET=CHANGEZ_MOI_GENEREZ_UN_SECRET_FORT
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=AUTRE_SECRET_DIFFERENT_ET_FORT
JWT_REFRESH_EXPIRES_IN=30d

FRONTEND_URL=https://www.figma.com
FIGMA_PLUGIN_URL=figma://plugin

CREDIT_COST_MASCOT=1
CREDIT_COST_ANIMATION=25
CREDIT_COST_LOGO_PACK=20
```

**Générer des secrets forts** :
```bash
openssl rand -base64 32
```

### 2.6 Générer un domaine

1. **Settings** → **Networking**
2. **"Generate Domain"**
3. Copiez l'URL : `https://mascot-production-abc123.up.railway.app`

✅ **Backend déployé !**

---

## 📋 Étape 3 : Mettre à jour le plugin (2 min)

Je vais le faire pour vous une fois que vous me donnez l'URL Railway.

**Donnez-moi l'URL** et je mettrai à jour automatiquement :
- `figma-plugin/src/api/client.ts`
- `figma-plugin/manifest.json`
- Je rebuilderai le plugin

---

## 📋 Étape 4 : Créer un compte production

Je créerai le compte pour vous avec l'URL Railway et vous donnerai le token.

---

## 🎯 Actions MAINTENANT

### Action 1 : Créer le repo GitHub

1. https://github.com/new
2. Nom : `mascot`
3. **Create repository**
4. Exécutez les commandes pour pousser

**Dites-moi quand c'est fait** ✅

### Action 2 : Créer le projet Railway

1. https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Choisissez `mascot`
4. Ajoutez PostgreSQL et Redis
5. Configurez les variables
6. Générez un domaine

**Donnez-moi l'URL Railway** quand c'est prêt

---

## ⏱️ Temps total estimé : 10 minutes

- Repo GitHub : 2 min
- Railway setup : 5 min
- Mise à jour plugin : 2 min (je le fais)
- Test : 1 min

---

## 🆘 Besoin d'aide ?

Si vous bloquez à une étape, dites-moi où et je vous aide !

**Commencez par créer le repo GitHub** → https://github.com/new 🚀
