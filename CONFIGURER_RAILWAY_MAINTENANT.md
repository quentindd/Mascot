# 🎯 Configuration Railway - ÉTAPE PAR ÉTAPE

Railway ne détecte pas automatiquement le backend. **Configuration manuelle requise**.

---

## 📋 Étapes à suivre MAINTENANT

### 1. Ouvrir Railway

Allez sur : https://railway.app/dashboard

### 2. Cliquez sur votre projet "mascot"

Vous verrez votre service qui a échoué.

### 3. Cliquez sur le service

Le rectangle/carte qui représente votre backend.

### 4. Onglet "Settings" ⚙️

En haut, cliquez sur **"Settings"**.

### 5. Scrollez jusqu'à "Build"

Cherchez la section **"Build"** ou **"Service"**.

### 6. Configurez "Root Directory"

Vous verrez un champ **"Root Directory"** (ou "Working Directory").

**Tapez exactement** : `backend`

Appuyez sur **Entrée** pour sauvegarder.

### 7. Configurez les commandes (si visibles)

Si vous voyez ces champs, remplissez-les :

| Champ | Valeur |
|-------|--------|
| **Install Command** | `npm ci` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start:prod` |

**Si ces champs ne sont pas visibles**, ce n'est pas grave, le Root Directory suffit.

### 8. Redéployer

**Option A** : Onglet "Deployments"
- Cliquez sur les **trois points** [...] du dernier déploiement
- Sélectionnez **"Redeploy"**

**Option B** : Bouton Deploy
- En haut à droite, cliquez sur **"Deploy"**

---

## ✅ Vérification

Le build devrait maintenant fonctionner. Vous verrez :

```
✓ Initialization
✓ Build > Build image
  → npm ci (dans backend/)
  → npm run build (dans backend/)
✓ Deploy
  → npm run start:prod
```

⚠️ **Le démarrage va échouer** car PostgreSQL et Redis ne sont pas encore ajoutés → c'est normal !

---

## 🔴 Si ça échoue encore

Faites une **capture d'écran** de :
1. La page Settings avec le champ Root Directory rempli
2. Les logs du déploiement

Et partagez-les moi.

---

## 👉 Une fois le build réussi (même si le start échoue)

**Dites-moi "build ok"** et on ajoutera PostgreSQL et Redis ! 🚀
