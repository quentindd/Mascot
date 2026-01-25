# 🎯 Railway - Guide visuel pas à pas

## Problème actuel

❌ **"Error creating build plan with Railpack"**

Railway ne trouve pas le backend car il est dans `backend/` et non à la racine.

---

## 🔧 Solution : Configuration manuelle

### Étape 1 : Ouvrir les Settings

Dans Railway :

```
[Votre projet]
  └─ [Service mascot/backend] ← Cliquez dessus
       └─ Onglets en haut : Deployments | Metrics | Variables | Settings
            └─ Cliquez sur "Settings" ←
```

---

### Étape 2 : Trouver la section Build

Scrollez vers le bas dans Settings jusqu'à voir :

```
┌─────────────────────────────────────┐
│  Build                              │
│                                     │
│  Root Directory                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │ ← Tapez : backend
│  └───────────────────────────────┘ │
│                                     │
│  Install Command                    │
│  ┌───────────────────────────────┐ │
│  │ npm ci                        │ │ ← Laissez ou tapez : npm ci
│  └───────────────────────────────┘ │
│                                     │
│  Build Command                      │
│  ┌───────────────────────────────┐ │
│  │ npm run build                 │ │ ← Tapez : npm run build
│  └───────────────────────────────┘ │
│                                     │
│  Start Command                      │
│  ┌───────────────────────────────┐ │
│  │ npm run start:prod            │ │ ← Tapez : npm run start:prod
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### Étape 3 : Remplir les champs

**Root Directory** :
```
backend
```

**Install Command** :
```
npm ci
```

**Build Command** :
```
npm run build
```

**Start Command** :
```
npm run start:prod
```

Railway sauvegarde automatiquement (vous verrez un petit indicateur).

---

### Étape 4 : Redéployer

#### Option A : Depuis l'onglet Deployments

```
Deployments (onglet)
  └─ Liste des déploiements
       └─ Dernier déploiement (FAILED)
            └─ [...] (trois points à droite) ← Cliquez
                 └─ "Redeploy" ← Cliquez
```

#### Option B : Depuis la vue principale

En haut à droite du service, cherchez un bouton **"Deploy"** ou **"Redeploy"**.

---

### Étape 5 : Attendre le nouveau build

Railway va redéployer avec la bonne configuration.

**Durée** : 2-3 minutes

**Vous verrez** :
```
Building... (00:00)
  ↓
✓ Initialization (00:00)
  ↓
Building... (00:02)
  ↓
✓ Build > Build image (00:02)
  ↓
Deploying... (00:01)
  ↓
✓ Deploy (00:01)
  ↓
SUCCESS ✅
```

---

## ✅ Vérification

### Dans les logs

Cliquez sur **"View logs"** → Vous devriez voir :

```
[Nest] 1  - 01/24/2026, 2:30:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 01/24/2026, 2:30:00 PM     LOG [InstanceLoader] AppModule dependencies initialized +20ms
...
🚀 Mascot API is running on: http://localhost:3000/api/v1
📚 Swagger docs available at: http://localhost:3000/api/docs
```

### Si ça échoue au démarrage

⚠️ **C'est normal !** Le backend ne peut pas démarrer sans PostgreSQL et Redis.

Vous verrez une erreur de connexion :
```
ERROR [TypeOrmModule] Unable to connect to the database
```

**Solution** : Ajoutez PostgreSQL et Redis (prochaine étape).

---

## 🎯 Résumé des paramètres exacts

| Champ | Valeur exacte |
|-------|---------------|
| Root Directory | `backend` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Start Command | `npm run start:prod` |

**Copiez-collez ces valeurs exactement.**

---

## 📋 Checklist

- [ ] Settings ouvert
- [ ] Section Build trouvée
- [ ] Root Directory = `backend`
- [ ] Install Command = `npm ci`
- [ ] Build Command = `npm run build`
- [ ] Start Command = `npm run start:prod`
- [ ] Redéployé manuellement
- [ ] Logs vérifiés

---

## 🆘 Toujours une erreur ?

**Partagez-moi** :
1. L'erreur exacte dans les logs
2. Un screenshot de la section Build avec les valeurs que vous avez entrées

Je pourrai alors vous aider plus précisément ! 🚀
