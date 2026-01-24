# 🌐 Déploiement en production

## Objectif

Actuellement :
- ❌ Backend sur localhost (uniquement accessible localement)
- ❌ ngrok (URL temporaire, gratuit limité)
- ❌ Nécessite de garder les terminaux ouverts

En production :
- ✅ Backend accessible 24/7
- ✅ URL permanente
- ✅ Pas de terminaux à garder ouverts
- ✅ Conditions réelles

---

## Options de déploiement (du plus simple au plus complexe)

### Option 1 : Railway (Recommandé - Le plus simple)

**Avantages** :
- ✅ Gratuit pour commencer (500h/mois)
- ✅ PostgreSQL inclus
- ✅ Redis inclus
- ✅ Déploiement en 5 minutes
- ✅ URL permanente automatique
- ✅ SSL/HTTPS inclus

**Étapes** :

1. **Créer un compte** : https://railway.app
2. **Créer un nouveau projet**
3. **Déployer depuis GitHub** (ou directement depuis le code)
4. Railway détecte automatiquement NestJS
5. Ajouter PostgreSQL et Redis depuis le dashboard
6. Configurer les variables d'environnement

**Coût** : Gratuit puis ~$5-20/mois selon l'usage

---

### Option 2 : Render

**Avantages** :
- ✅ Gratuit pour commencer
- ✅ PostgreSQL inclus
- ✅ Simple à configurer
- ✅ SSL/HTTPS inclus

**Inconvénients** :
- ⚠️ Le tier gratuit "s'endort" après 15 min d'inactivité (redémarre en ~30s)

**Étapes** :

1. **Créer un compte** : https://render.com
2. **New → Web Service**
3. Connecter votre repo GitHub
4. Render détecte NestJS automatiquement
5. Ajouter PostgreSQL depuis le dashboard
6. Configurer les variables d'environnement

**Coût** : Gratuit (avec limitations) ou $7/mois

---

### Option 3 : Fly.io

**Avantages** :
- ✅ Gratuit généreusement
- ✅ Déploiement via CLI simple
- ✅ Très rapide
- ✅ Edge locations (proche des utilisateurs)

**Étapes** :

1. Installer flyctl : `brew install flyctl`
2. Login : `flyctl auth login`
3. Dans le dossier backend : `flyctl launch`
4. Ajouter PostgreSQL : `flyctl postgres create`
5. Ajouter Redis : `flyctl redis create`

**Coût** : Gratuit jusqu'à ~$5/mois

---

### Option 4 : Vercel + Neon/Supabase

**Avantages** :
- ✅ Vercel gratuit pour le backend
- ✅ Neon (PostgreSQL) gratuit
- ✅ Upstash (Redis) gratuit

**Inconvénients** :
- ⚠️ Nécessite d'adapter le code pour serverless

---

### Option 5 : VPS (DigitalOcean, Linode, etc.)

**Pour les plus techniques**

**Avantages** :
- ✅ Contrôle total
- ✅ Prix fixe (~$5-10/mois)

**Inconvénients** :
- ❌ Configuration manuelle
- ❌ Maintenance (mises à jour, sécurité)
- ❌ Plus complexe

---

## 🚀 Guide complet : Déploiement sur Railway (recommandé)

### Étape 1 : Préparer le code

**1.1 Créer un repo GitHub** (si pas déjà fait) :

```bash
cd /Users/quentin/Documents/Mascot
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE_USERNAME/mascot.git
git push -u origin main
```

**1.2 Ajouter un `railway.json`** dans le dossier `backend/` :

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**1.3 Mettre à jour le `.gitignore`** :

Assurez-vous que `.env` est dans `.gitignore` (déjà fait normalement)

---

### Étape 2 : Déployer sur Railway

**2.1 Créer un compte** :
- Allez sur https://railway.app
- Connectez-vous avec GitHub

**2.2 Nouveau projet** :
1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez votre repo `mascot`
4. Railway va détecter automatiquement le backend NestJS

**2.3 Ajouter PostgreSQL** :
1. Dans votre projet, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"Add PostgreSQL"**
3. Railway va automatiquement créer la variable `DATABASE_URL`

**2.4 Ajouter Redis** :
1. Cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"Add Redis"**
3. Railway va automatiquement créer les variables Redis

**2.5 Configurer les variables d'environnement** :

Dans le dashboard Railway, allez dans votre service backend → **Variables** :

```
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# JWT (générez des secrets forts)
JWT_SECRET=votre-secret-super-securise-changez-moi
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=autre-secret-super-securise
JWT_REFRESH_EXPIRES_IN=30d

# Les autres seront automatiques (DATABASE_URL, REDIS_URL)
```

**2.6 Déployer** :
- Railway déploie automatiquement
- Vous obtiendrez une URL comme : `https://mascot-production-abc123.up.railway.app`

---

### Étape 3 : Configurer le domaine (optionnel)

**3.1 Domaine personnalisé gratuit** :
- Railway vous donne un sous-domaine : `mascot-production.up.railway.app`

**3.2 Votre propre domaine** (si vous en avez un) :
1. Dans Railway, allez dans **Settings** → **Domains**
2. Ajoutez votre domaine : `api.mascot.com`
3. Configurez les DNS chez votre registrar

---

### Étape 4 : Mettre à jour le plugin

**4.1 Modifier `figma-plugin/src/api/client.ts`** :

```typescript
const API_BASE_URL = 'https://mascot-production.up.railway.app/api/v1';
```

**4.2 Modifier `figma-plugin/manifest.json`** :

```json
"networkAccess": {
  "allowedDomains": [
    "https://mascot-production.up.railway.app"
  ]
}
```

**4.3 Rebuilder** :

```bash
cd figma-plugin
npm run build
```

**4.4 Recharger dans Figma** :
- Rechargez le manifest.json
- Ou rechargez le plugin

---

### Étape 5 : Créer un nouveau compte

Votre compte local ne fonctionnera pas avec le backend production.

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre@email.com",
    "password": "VotreMotDePasse123!",
    "name": "Votre Nom"
  }'
```

Copiez le `accessToken` et utilisez-le dans le plugin.

---

## 📊 Comparaison des options

| Service      | Gratuit | PostgreSQL | Redis | SSL | Facilité | Recommandation |
|--------------|---------|------------|-------|-----|----------|----------------|
| **Railway**  | 500h    | ✅         | ✅    | ✅  | ⭐⭐⭐⭐⭐ | **Meilleur**   |
| **Render**   | ✅ *    | ✅         | ❌    | ✅  | ⭐⭐⭐⭐   | Bien           |
| **Fly.io**   | ✅      | ✅         | ✅    | ✅  | ⭐⭐⭐    | Bien           |
| **Vercel**   | ✅      | Via Neon   | Via Upstash | ✅ | ⭐⭐⭐ | Serverless |
| **VPS**      | Non     | Manual     | Manual | Manual | ⭐⭐ | Avancé    |

\* Render gratuit "s'endort" après 15 min d'inactivité

---

## 🔐 Sécurité en production

### Variables d'environnement

**NE JAMAIS** commiter ces valeurs :
- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- Clés API (Replicate, etc.)

Utilisez le dashboard de votre plateforme pour les configurer.

### Générer des secrets forts

```bash
# JWT_SECRET
openssl rand -base64 32

# JWT_REFRESH_SECRET
openssl rand -base64 32
```

---

## 💰 Coûts estimés

### Phase de test (gratuit)
- Railway : 500h/mois gratuit = ~20 jours 24/7
- Render : Gratuit (avec sleep)
- Fly.io : Gratuit jusqu'à $5/mois

### Production légère (~100 utilisateurs/mois)
- Railway : $5-10/mois
- Render : $7/mois (pas de sleep)
- Fly.io : $5-10/mois
- VPS : $5-10/mois

### Production avec IA
- Infrastructure : $10-20/mois
- Replicate API : $0.00025/seconde
- Together AI : ~$0.10-0.50 par image
- Stockage S3 : ~$1-5/mois

**Exemple** : 1000 générations/mois = ~$100-500 selon le modèle

---

## 🎯 Recommandation

**Pour commencer** : **Railway**
- Le plus simple
- Tout inclus
- Gratuit pour tester
- Scale facilement

**Étapes** :
1. Créez un compte Railway
2. Déployez en 5 minutes
3. Testez le plugin en conditions réelles
4. Passez au plan payant si besoin (~$5/mois)

---

## 📚 Prochaines étapes

Une fois déployé en production :

1. ✅ Tester le plugin avec l'URL production
2. ✅ Implémenter l'intégration IA (Replicate/Together AI)
3. ✅ Configurer le stockage S3 pour les images
4. ✅ Ajouter du monitoring (Sentry, etc.)
5. ✅ Configurer les backups de la base de données

---

## 🆘 Besoin d'aide ?

Je peux vous aider à :
- Déployer sur Railway étape par étape
- Configurer votre domaine
- Implémenter l'intégration IA
- Optimiser les coûts

Dites-moi quelle option vous préférez ! 🚀
