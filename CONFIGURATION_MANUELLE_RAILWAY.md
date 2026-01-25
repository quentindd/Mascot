# 🎯 Configuration manuelle Railway - SOLUTION DEFINITIVE

## ❌ Problème

Railway affiche toujours "Error creating build plan with Railpack"

**Cause** : Railway ne détecte pas automatiquement que le backend est dans `backend/`

---

## ✅ Solution : Configuration manuelle via l'UI

### Étape 1 : Ouvrir les paramètres du service

Dans Railway :

1. Cliquez sur votre service (le rectangle qui dit "mascot" ou similaire)
2. **Onglet "Settings"** (en haut)

---

### Étape 2 : Configurer "Root Directory"

Scrollez jusqu'à la section **"Build"** ou **"Service"**

Cherchez le champ **"Root Directory"** (ou "Working Directory")

**Tapez** : `backend`

**Appuyez sur Entrée** pour sauvegarder

---

### Étape 3 : Configurer les commandes (si disponible)

Si vous voyez ces champs, remplissez-les :

| Champ | Valeur |
|-------|--------|
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Start Command | `npm run start:prod` |

**Si ces champs ne sont pas visibles**, ce n'est pas grave. Le Root Directory devrait suffire.

---

### Étape 4 : Redéployer

1. Allez dans **"Deployments"** (onglet en haut)
2. Trouvez le dernier déploiement (marqué FAILED)
3. Cliquez sur les **trois points** [...] à droite
4. Sélectionnez **"Redeploy"**

OU cliquez sur le bouton **"Deploy"** en haut à droite

---

### Étape 5 : Attendre le build (2-3 min)

Railway va redéployer avec la bonne configuration.

**Suivez les logs** en temps réel.

---

## 🔍 Ce que vous devriez voir dans les logs

### Build qui fonctionne

```
Cloning repository...
✓ Cloned
Checking out commit...
✓ Checked out
Running install command: npm ci
  → Running in /backend
  → Installing dependencies...
  → added 1234 packages
✓ Install complete
Running build command: npm run build
  → Compiling TypeScript...
  → Build successful
✓ Build complete
Starting application: npm run start:prod
  → Starting NestJS...
  🚀 Mascot API is running on: http://localhost:3000/api/v1
```

### Build qui échoue (après la config)

Si ça échoue même après avoir configuré Root Directory, l'erreur sera différente.

**Erreurs possibles** :

1. **"Cannot connect to database"**
   - ✅ C'est normal ! PostgreSQL n'est pas encore ajouté
   - → Continuez aux étapes suivantes

2. **"Module not found"** ou **"Dependency error"**
   - Vérifiez que `backend/package.json` existe
   - Partagez l'erreur exacte

---

## 🎯 Actions MAINTENANT

1. **Settings** → Root Directory = `backend`
2. **Redeploy**
3. **Attendez 2-3 minutes**
4. **Vérifiez les logs**

**Dites-moi ce que vous voyez** dans les logs ! 🚀

---

## 📸 Capture d'écran des Settings

Si vous ne trouvez pas le champ "Root Directory", faites une capture d'écran de la page Settings et partagez-la.

---

## Alternative : Restructurer le projet

Si la configuration manuelle ne fonctionne toujours pas, on peut restructurer le projet pour mettre le backend à la racine. Mais essayons d'abord la configuration manuelle !
