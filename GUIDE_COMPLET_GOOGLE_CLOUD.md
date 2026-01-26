# 🎯 Guide complet : Configurer Google Cloud pour générer des images

## 📋 Situation actuelle

**Problème** : Les mascots sont créés mais les images ne s'affichent pas (erreur d'authentification Google Cloud)

**Solution** : Configurer les credentials Google Cloud dans Railway

---

## ✅ Étape 1 : Vérifier que vous avez un fichier JSON de credentials

### 1.1 Aller dans Google Cloud Console

1. Allez sur https://console.cloud.google.com
2. Sélectionnez votre projet
3. Allez dans **IAM & Admin** → **Service Accounts**
4. Cliquez sur votre service account (ex: `mascot-ai-generator`)
5. Allez dans l'onglet **Keys** (Clés)

### 1.2 Télécharger la clé JSON

1. Si vous avez déjà une clé active, vous pouvez en créer une nouvelle
2. Cliquez sur **"Ajouter une clé"** → **"Créer une nouvelle clé"**
3. Choisissez **JSON**
4. Le fichier se télécharge automatiquement (généralement dans `~/Downloads`)

**✅ Vérification** : Vous devez avoir un fichier `.json` quelque part sur votre Mac

---

## ✅ Étape 2 : Encoder le fichier JSON en base64

### Option A : Script automatique (Recommandé)

```bash
cd /Users/quentin/Documents/Mascot
node scripts/encode-google-credentials.js
```

Le script va :
- Chercher automatiquement votre fichier JSON
- L'encoder en base64
- Afficher les 3 variables à copier

### Option B : Commande manuelle

Si vous savez où est votre fichier :

```bash
cat ~/Downloads/votre-fichier-key.json | base64
```

**⚠️ Important** : Copiez TOUTE la chaîne base64 (c'est très long, sans retours à la ligne)

---

## ✅ Étape 3 : Trouver votre Project ID

Dans Google Cloud Console :
1. En haut à gauche, à côté du logo Google Cloud, vous voyez le nom de votre projet
2. Cliquez dessus
3. Vous verrez l'**ID du projet** (ex: `my-project-123456`)

**Ou** : Le script `encode-google-credentials.js` l'affiche aussi automatiquement

---

## ✅ Étape 4 : Configurer dans Railway

### 4.1 Aller dans Railway

1. Allez sur https://railway.app
2. Connectez-vous
3. Sélectionnez votre projet **Mascot**
4. Cliquez sur votre service **backend**

### 4.2 Ajouter les variables

1. Cliquez sur l'onglet **Variables** (en haut)
2. Cliquez sur **"New Variable"** (ou **"Nouvelle variable"**)

Ajoutez ces **3 variables** une par une :

#### Variable 1 : `GOOGLE_CLOUD_PROJECT_ID`
- **Nom** : `GOOGLE_CLOUD_PROJECT_ID`
- **Valeur** : L'ID de votre projet (ex: `my-project-123456`)
- Cliquez sur **"Add"**

#### Variable 2 : `GOOGLE_CLOUD_CREDENTIALS`
- **Nom** : `GOOGLE_CLOUD_CREDENTIALS`
- **Valeur** : La chaîne base64 complète (très longue, sans espaces)
- Cliquez sur **"Add"**

#### Variable 3 : `GOOGLE_CLOUD_LOCATION`
- **Nom** : `GOOGLE_CLOUD_LOCATION`
- **Valeur** : `us-central1`
- Cliquez sur **"Add"**

### 4.3 Vérifier

Vous devriez voir ces 3 variables dans la liste :
- ✅ `GOOGLE_CLOUD_PROJECT_ID`
- ✅ `GOOGLE_CLOUD_CREDENTIALS`
- ✅ `GOOGLE_CLOUD_LOCATION`

---

## ✅ Étape 5 : Vérifier que l'API est activée

1. Allez sur https://console.cloud.google.com
2. Allez dans **APIs & Services** → **Library**
3. Cherchez **"Vertex AI API"**
4. Vérifiez qu'elle est **activée** (bouton "Manage" si activée)
5. Si elle n'est pas activée, cliquez sur **"Enable"**

---

## ✅ Étape 6 : Attendre le redéploiement

Railway redéploie automatiquement quand vous ajoutez des variables.

**Temps d'attente** : 1-2 minutes

Vous pouvez voir le statut dans Railway → **Deployments**

---

## ✅ Étape 7 : Vérifier que ça fonctionne

### 7.1 Vérifier les logs Railway

1. Dans Railway → votre service backend → **Deployments** → **View Logs**
2. Cherchez ces messages au démarrage :

**✅ Si ça fonctionne, vous verrez :**
```
[GeminiFlashService] Initializing Gemini Flash with project: <project-id>
[GeminiFlashService] Decoded credentials successfully. Client email: <email>
[GeminiFlashService] Gemini 2.5 Flash Image service initialized successfully
```

**❌ Si ça ne fonctionne pas, vous verrez :**
```
[GeminiFlashService] Failed to initialize Gemini Flash service
GoogleAuthError: Unable to authenticate your request
```

### 7.2 Tester la génération

1. Ouvrez votre plugin Figma
2. Générez un nouveau mascot
3. Les images devraient maintenant s'afficher ! 🎉

---

## 🐛 Dépannage

### Problème : "Unable to authenticate your request"

**Causes possibles :**
1. ❌ `GOOGLE_CLOUD_PROJECT_ID` ne correspond pas au `project_id` dans le JSON
2. ❌ `GOOGLE_CLOUD_CREDENTIALS` est mal encodé (espaces, retours à la ligne)
3. ❌ L'API Vertex AI n'est pas activée
4. ❌ Le service account n'a pas les bonnes permissions

**Solutions :**
1. Vérifiez que le `GOOGLE_CLOUD_PROJECT_ID` = le `project_id` dans votre fichier JSON
2. Ré-encodez le fichier JSON avec le script
3. Activez l'API Vertex AI dans Google Cloud Console
4. Vérifiez que le service account a le rôle "Vertex AI User"

### Problème : Le script ne trouve pas le fichier

Spécifiez le chemin manuellement :
```bash
node scripts/encode-google-credentials.js ~/Downloads/votre-fichier.json
```

### Problème : Les variables ne sont pas sauvegardées dans Railway

1. Vérifiez que vous êtes dans le bon service (backend)
2. Vérifiez que vous avez les permissions
3. Essayez de supprimer et recréer les variables

---

## 📝 Checklist finale

Avant de tester, vérifiez que vous avez :

- [ ] Un fichier JSON de credentials téléchargé
- [ ] Les 3 variables configurées dans Railway :
  - [ ] `GOOGLE_CLOUD_PROJECT_ID`
  - [ ] `GOOGLE_CLOUD_CREDENTIALS` (base64)
  - [ ] `GOOGLE_CLOUD_LOCATION`
- [ ] L'API Vertex AI activée dans Google Cloud
- [ ] Railway redéployé (vérifier dans Deployments)
- [ ] Les logs Railway montrent "initialized successfully"

---

## 🎯 Résumé rapide

1. **Télécharger** le fichier JSON depuis Google Cloud Console
2. **Encoder** avec `node scripts/encode-google-credentials.js`
3. **Copier** les 3 variables affichées
4. **Ajouter** dans Railway → Variables
5. **Vérifier** les logs Railway
6. **Tester** la génération dans Figma

---

## 💡 Besoin d'aide ?

Si vous êtes bloqué à une étape, dites-moi :
1. À quelle étape vous êtes
2. Quel message d'erreur vous voyez (si erreur)
3. Ce que vous avez déjà fait

Je vous aiderai à continuer ! 🚀
