# ⚙️ Configuration Railway - Étapes suivantes

## ✅ Projet sélectionné

Railway est en train de builder votre backend (2-3 minutes).

---

## 📋 Étapes à suivre maintenant

### 1️⃣ Attendre le build (2-3 min)

Railway va :
- Installer les dépendances (`npm install`)
- Builder le backend (`npm run build`)
- Démarrer l'application

**Vérifiez** : Les logs affichent le build en temps réel.

⚠️ **Le build va échouer** au démarrage car il manque PostgreSQL et Redis - c'est normal !

---

### 2️⃣ Ajouter PostgreSQL (1 min)

Dans votre projet Railway :

1. Cliquez sur **"+ New"** (en haut à droite ou dans le projet)
2. Sélectionnez **"Database"**
3. Choisissez **"Add PostgreSQL"**

✅ Railway va automatiquement :
- Créer une base de données PostgreSQL
- Générer la variable `DATABASE_URL`
- L'injecter dans votre backend

---

### 3️⃣ Ajouter Redis (1 min)

1. Cliquez encore sur **"+ New"**
2. **"Database"** → **"Add Redis"**

✅ Railway va automatiquement :
- Créer un Redis
- Générer les variables Redis
- Les injecter dans votre backend

---

### 4️⃣ Configurer les variables d'environnement (2 min)

1. Cliquez sur votre service **"backend"** (le rectangle principal)
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"+ New Variable"**

**Ajoutez ces variables une par une** :

```
NODE_ENV = production
PORT = 3000
API_PREFIX = api/v1
JWT_SECRET = CHANGEZ_MOI_PAR_SECRET_FORT
JWT_EXPIRES_IN = 7d
JWT_REFRESH_SECRET = AUTRE_SECRET_FORT_DIFFERENT
JWT_REFRESH_EXPIRES_IN = 30d
FRONTEND_URL = https://www.figma.com
FIGMA_PLUGIN_URL = figma://plugin
CREDIT_COST_MASCOT = 1
CREDIT_COST_ANIMATION = 25
CREDIT_COST_LOGO_PACK = 20
```

**⚠️ IMPORTANT** : Générez des secrets forts pour `JWT_SECRET` et `JWT_REFRESH_SECRET`

**Dans un terminal local** :
```bash
openssl rand -base64 32
```

Copiez le résultat et utilisez-le pour `JWT_SECRET`, puis générez-en un autre pour `JWT_REFRESH_SECRET`.

---

### 5️⃣ Redéployer (automatique)

Une fois les variables ajoutées, Railway redéploie automatiquement.

**Attendez 1-2 minutes** que le nouveau déploiement se termine.

**Vérifiez dans les logs** : vous devriez voir :
```
🚀 Mascot API is running on: http://localhost:3000/api/v1
```

---

### 6️⃣ Générer un domaine public (1 min)

1. Cliquez sur votre service **"backend"**
2. Allez dans l'onglet **"Settings"**
3. Section **"Networking"**
4. Cliquez sur **"Generate Domain"**

Railway va générer une URL comme :
```
https://mascot-production-abc123.up.railway.app
```

**📋 COPIEZ CETTE URL !**

---

### 7️⃣ Tester l'URL (30 sec)

Dans votre navigateur, ouvrez :
```
https://VOTRE_URL.up.railway.app/api/v1/auth/login
```

Vous devriez voir une erreur JSON (c'est normal, pas encore de compte) :
```json
{"statusCode":401,"message":"Unauthorized"}
```

✅ **Si vous voyez ça, le backend fonctionne !**

---

## 🎯 Ensuite : Donnez-moi l'URL

Une fois que tout est déployé et que l'URL fonctionne, **donnez-moi l'URL Railway** :

```
https://mascot-production-abc123.up.railway.app
```

Je ferai automatiquement :
- ✅ Mettre à jour le plugin avec votre URL
- ✅ Rebuilder le plugin
- ✅ Créer un compte production
- ✅ Vous donner le token pour Figma

---

## 🐛 Problèmes courants

### Le backend ne démarre pas

**Vérifiez dans les logs** :
- Erreur de connexion PostgreSQL → Assurez-vous que PostgreSQL est bien ajouté
- Erreur de connexion Redis → Assurez-vous que Redis est bien ajouté
- Erreur de variable → Vérifiez que toutes les variables sont configurées

### "Cannot connect to database"

- Vérifiez que PostgreSQL est bien dans le même projet
- Railway injecte automatiquement `DATABASE_URL`, pas besoin de la configurer manuellement

### Le domaine ne fonctionne pas

- Attendez 1-2 minutes après génération
- Vérifiez que le déploiement est terminé (statut "Success")

---

## 📊 Checklist

- [ ] Build terminé avec succès
- [ ] PostgreSQL ajouté
- [ ] Redis ajouté
- [ ] Variables d'environnement configurées
- [ ] Redéploiement terminé
- [ ] Domaine généré
- [ ] URL testée et fonctionne

---

## 🚀 Commencez maintenant !

Suivez les étapes 2-6, puis donnez-moi votre URL Railway ! 🎉
