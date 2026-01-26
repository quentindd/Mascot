# 🚀 Configuration automatique Railway pour Google Cloud

## Option 1 : Script automatique (Recommandé)

### Prérequis

1. **Installer Railway CLI** :
   ```bash
   npm install -g @railway/cli
   ```

2. **Se connecter à Railway** :
   ```bash
   railway login
   ```

### Utilisation

1. **Téléchargez votre fichier JSON** depuis Google Cloud Console (Service Accounts → Keys)

2. **Exécutez le script** :
   ```bash
   cd /Users/quentin/Documents/Mascot
   node scripts/setup-railway-google-cloud.js
   ```

   Ou si vous savez où est le fichier :
   ```bash
   node scripts/setup-railway-google-cloud.js ~/Downloads/votre-fichier.json
   ```

3. **Le script va** :
   - Trouver automatiquement votre fichier JSON
   - L'encoder en base64
   - Vous demander le nom du service backend
   - Configurer automatiquement les 3 variables dans Railway
   - Railway redéploiera automatiquement

## Option 2 : Script semi-automatique (Sans Railway CLI)

Si vous ne voulez pas installer Railway CLI :

1. **Exécutez le script d'encodage** :
   ```bash
   node scripts/encode-google-credentials.js
   ```

2. **Copiez les 3 variables affichées**

3. **Dans Railway** :
   - Allez dans votre projet → Service backend → **Variables**
   - Cliquez sur **"New Variable"** pour chaque variable
   - Collez les valeurs

## Option 3 : Configuration manuelle

### Étape 1 : Encoder les credentials

```bash
cat ~/Downloads/votre-fichier-key.json | base64
```

Copiez tout le résultat (longue chaîne base64).

### Étape 2 : Dans Railway

1. Allez dans **Railway** → votre projet → **Service backend**
2. Cliquez sur **Variables** (onglet en haut)
3. Ajoutez ces 3 variables :

| Variable | Valeur |
|----------|--------|
| `GOOGLE_CLOUD_PROJECT_ID` | L'ID de votre projet (ex: `my-project-123456`) |
| `GOOGLE_CLOUD_CREDENTIALS` | La chaîne base64 complète (sans retours à la ligne) |
| `GOOGLE_CLOUD_LOCATION` | `us-central1` |

4. Railway redéploiera automatiquement

## Vérification

Après le redéploiement, vérifiez les logs Railway. Vous devriez voir :

```
[GeminiFlashService] Initializing Gemini Flash with project: <project-id>
[GeminiFlashService] Decoded credentials successfully. Client email: <email>
[GeminiFlashService] Gemini 2.5 Flash Image service initialized successfully
```

Au lieu de l'erreur d'authentification.

## Dépannage

### Railway CLI non trouvé
```bash
npm install -g @railway/cli
railway login
```

### Erreur d'authentification
Vérifiez que :
- Le `GOOGLE_CLOUD_PROJECT_ID` correspond au `project_id` dans le JSON
- Le `GOOGLE_CLOUD_CREDENTIALS` est bien encodé en base64 (sans espaces/retours à la ligne)
- L'API Vertex AI est activée dans Google Cloud

### Le script ne trouve pas le fichier
Spécifiez le chemin manuellement :
```bash
node scripts/setup-railway-google-cloud.js /chemin/complet/vers/fichier.json
```
