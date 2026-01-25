# 🔧 Solution : Configurer Railway via l'interface

## Le fichier nixpacks.toml ne suffit pas

Railway a besoin d'être configuré manuellement via son interface.

---

## 📋 Configuration via Railway UI (2 minutes)

### Étape 1 : Aller dans les Settings

1. Dans Railway, cliquez sur votre service **"mascot"** ou **"backend"**
2. Allez dans l'onglet **"Settings"**
3. Scrollez jusqu'à la section **"Build"**

---

### Étape 2 : Configurer le Root Directory

**Root Directory** → Entrez : `backend`

Cela indique à Railway que le code est dans le dossier `backend/`

---

### Étape 3 : Configurer les commandes

Dans la même section **"Build"** :

**Install Command** → Entrez : `npm ci`

**Build Command** → Entrez : `npm run build`

**Start Command** → Entrez : `npm run start:prod`

---

### Étape 4 : Sauvegarder

Railway sauvegarde automatiquement.

---

### Étape 5 : Redéployer manuellement

1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur le menu (trois points) du dernier déploiement
3. Sélectionnez **"Redeploy"**

OU

1. En haut à droite du service
2. Cliquez sur **"Deploy"** ou **"Redeploy"**

---

## ✅ Vérification

Le build devrait maintenant fonctionner !

**Dans les logs** :
```
✓ Initialization
✓ Build > Build image
  → npm ci (dans backend/)
  → npm run build (dans backend/)
✓ Deploy
  → npm run start:prod
✓ Post-deploy
```

**À la fin** :
```
🚀 Mascot API is running on: http://localhost:3000/api/v1
```

---

## 🎯 Récapitulatif des paramètres

| Paramètre | Valeur |
|-----------|--------|
| **Root Directory** | `backend` |
| **Install Command** | `npm ci` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start:prod` |

---

## 📸 Où trouver ces paramètres ?

```
Service → Settings → Scrollez vers le bas → Section "Build"
```

Vous verrez des champs de texte pour :
- Root Directory
- Install Command
- Build Command
- Start Command

---

## ⚠️ Si ça échoue encore

### Vérifiez le package.json

Le fichier `backend/package.json` doit avoir ces scripts :
```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main"
  }
}
```

✅ C'est déjà le cas dans votre projet.

### Vérifiez les logs détaillés

Cliquez sur **"View logs"** et cherchez l'erreur exacte.

Possibles erreurs :
- Erreur npm (dépendances manquantes)
- Erreur TypeScript (code ne compile pas)
- Erreur de connexion (PostgreSQL/Redis pas encore ajoutés)

**Note** : C'est normal que ça échoue au démarrage si PostgreSQL et Redis ne sont pas encore ajoutés !

---

## 🚀 Actions MAINTENANT

1. **Allez dans Settings → Build**
2. **Root Directory** : `backend`
3. **Install Command** : `npm ci`
4. **Build Command** : `npm run build`
5. **Start Command** : `npm run start:prod`
6. **Redéployez**
7. **Attendez 2-3 minutes**

Dites-moi quand c'est fait ! 🎯
