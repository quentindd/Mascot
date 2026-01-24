# 🚂 Guide pas à pas : Déploiement sur Railway

## Temps estimé : 10 minutes

---

## Étape 1 : Créer un compte Railway (2 min)

1. Allez sur : https://railway.app
2. Cliquez sur **"Start a New Project"**
3. Connectez-vous avec **GitHub**
4. Autorisez Railway à accéder à vos repos

✅ **Compte créé !**

---

## Étape 2 : Pousser votre code sur GitHub (3 min)

### Si vous n'avez pas encore de repo GitHub :

```bash
cd /Users/quentin/Documents/Mascot

# Initialiser git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Mascot backend"

# Créer un repo sur GitHub
# Allez sur github.com → New repository → "mascot"
# Puis :

git remote add origin https://github.com/VOTRE_USERNAME/mascot.git
git branch -M main
git push -u origin main
```

### Si vous avez déjà un repo :

```bash
git add .
git commit -m "Ready for Railway deployment"
git push
```

✅ **Code sur GitHub !**

---

## Étape 3 : Créer le projet Railway (2 min)

1. Dans Railway, cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez votre repo **"mascot"**
4. Railway détecte automatiquement :
   - Le dossier `backend/`
   - Node.js + NestJS
   - Les dépendances npm

Railway commence à builder...

✅ **Projet créé !**

---

## Étape 4 : Ajouter PostgreSQL (1 min)

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"**
3. Choisissez **"Add PostgreSQL"**

Railway va automatiquement :
- ✅ Créer une base de données PostgreSQL
- ✅ Générer `DATABASE_URL`
- ✅ L'injecter dans votre backend

✅ **PostgreSQL ajouté !**

---

## Étape 5 : Ajouter Redis (1 min)

1. Cliquez encore sur **"+ New"**
2. Sélectionnez **"Database"**
3. Choisissez **"Add Redis"**

Railway va automatiquement :
- ✅ Créer un Redis
- ✅ Générer `REDIS_URL`
- ✅ L'injecter dans votre backend

✅ **Redis ajouté !**

---

## Étape 6 : Configurer les variables d'environnement (2 min)

1. Cliquez sur votre service **"backend"**
2. Allez dans l'onglet **"Variables"**
3. Ajoutez ces variables :

```
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

JWT_SECRET=CHANGEZ_MOI_SECRET_SUPER_FORT_123456789
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=AUTRE_SECRET_SUPER_FORT_987654321
JWT_REFRESH_EXPIRES_IN=30d

FRONTEND_URL=https://www.figma.com
FIGMA_PLUGIN_URL=figma://plugin

CREDIT_COST_MASCOT=1
CREDIT_COST_ANIMATION=25
CREDIT_COST_LOGO_PACK=20
```

**Important** : Générez des secrets forts pour `JWT_SECRET` et `JWT_REFRESH_SECRET` !

```bash
# Dans un terminal local :
openssl rand -base64 32
```

✅ **Variables configurées !**

---

## Étape 7 : Obtenir votre URL de production (1 min)

1. Dans Railway, allez dans **Settings** → **Networking**
2. Cliquez sur **"Generate Domain"**
3. Railway génère une URL comme : `mascot-production-abc123.up.railway.app`

**Copiez cette URL !**

✅ **URL obtenue !**

Exemple : `https://mascot-production-abc123.up.railway.app`

---

## Étape 8 : Mettre à jour le plugin (2 min)

### 8.1 Modifier l'URL de l'API

Éditez `/Users/quentin/Documents/Mascot/figma-plugin/src/api/client.ts` :

```typescript
const API_BASE_URL = 'https://mascot-production-abc123.up.railway.app/api/v1';
```

(Remplacez par votre vraie URL Railway)

### 8.2 Modifier le manifest

Éditez `/Users/quentin/Documents/Mascot/figma-plugin/manifest.json` :

```json
"networkAccess": {
  "allowedDomains": [
    "https://mascot-production-abc123.up.railway.app"
  ]
}
```

### 8.3 Rebuilder le plugin

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin
npm run build
```

✅ **Plugin mis à jour !**

---

## Étape 9 : Tester le déploiement (1 min)

```bash
# Remplacez par votre URL Railway
curl https://mascot-production-abc123.up.railway.app/api/v1/auth/login

# Devrait retourner une erreur 401 (normal, pas encore de compte)
```

Si vous voyez une réponse JSON, c'est que ça fonctionne ! ✅

---

## Étape 10 : Créer un compte production (1 min)

```bash
# Remplacez par votre URL Railway
curl -X POST https://mascot-production-abc123.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre@email.com",
    "password": "VotreMotDePasse123!",
    "name": "Votre Nom"
  }'
```

**Copiez le `accessToken`** de la réponse !

✅ **Compte créé !**

---

## Étape 11 : Tester dans Figma (1 min)

1. Ouvrez **Figma**
2. **Plugins** → **Development** → **Mascot**
3. Si le plugin n'est pas chargé :
   - **Import plugin from manifest**
   - Sélectionnez : `/Users/quentin/Documents/Mascot/figma-plugin/manifest.json`
4. Cliquez sur **"Sign In with API Token"**
5. Collez le token obtenu à l'étape 10

✅ **Connecté en production !**

---

## 🎉 Félicitations !

Votre backend est maintenant en production :
- ✅ Accessible 24/7
- ✅ URL permanente
- ✅ PostgreSQL et Redis inclus
- ✅ SSL/HTTPS automatique
- ✅ Plus besoin de localhost ou ngrok

---

## 🔍 Vérification

### Logs en temps réel

Dans Railway :
1. Cliquez sur votre service **"backend"**
2. Onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Vous voyez les logs en temps réel

### Métriques

Railway affiche automatiquement :
- CPU usage
- Memory usage
- Network traffic
- Nombre de requêtes

---

## 📊 Plan gratuit Railway

- **500 heures/mois** gratuit
- = **~20 jours** d'utilisation continue 24/7
- = **Largement suffisant pour tester**

Après :
- **$5/mois** pour usage illimité
- PostgreSQL et Redis inclus

---

## 🔄 Déploiements automatiques

Railway redéploie automatiquement quand vous pushez sur GitHub :

```bash
# Faire des changements
git add .
git commit -m "Update backend"
git push

# Railway détecte et redéploie automatiquement !
```

---

## ⚙️ Prochaines étapes

Maintenant que votre backend est en production :

1. ✅ Testez le plugin dans des conditions réelles
2. 🔜 Implémenter l'intégration IA (Replicate)
3. 🔜 Configurer S3 pour le stockage des images
4. 🔜 Ajouter du monitoring

---

## 🆘 Problèmes courants

### Le backend ne démarre pas

1. Vérifiez les logs dans Railway
2. Vérifiez que toutes les variables d'environnement sont configurées
3. Vérifiez que `DATABASE_URL` et `REDIS_URL` sont bien injectées

### Cannot connect to database

- Railway injecte automatiquement `DATABASE_URL`
- Vérifiez dans **Variables** que la variable existe

### Le plugin ne se connecte pas

1. Vérifiez que l'URL dans `client.ts` est correcte
2. Vérifiez que l'URL est dans `manifest.json` → `allowedDomains`
3. Rebuildez le plugin
4. Rechargez le manifest dans Figma

---

## 📚 Ressources

- **Railway Docs** : https://docs.railway.app
- **Railway Discord** : https://discord.gg/railway
- **Railway Status** : https://status.railway.app

---

Besoin d'aide ? Dites-moi à quelle étape vous bloquez ! 🚀
