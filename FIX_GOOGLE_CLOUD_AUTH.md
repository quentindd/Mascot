# 🔧 Fix : Erreur d'authentification Google Cloud

## ❌ Erreur actuelle

```
GoogleAuthError: Unable to authenticate your request
```

## ✅ Solution : Configurer les credentials Google Cloud dans Railway

### Étape 1 : Obtenir les credentials Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet (ou créez-en un)
3. Allez dans **IAM & Admin** → **Service Accounts**
4. Créez un nouveau service account ou utilisez un existant
5. Cliquez sur le service account → **Keys** → **Add Key** → **Create new key**
6. Choisissez **JSON** et téléchargez le fichier

### Étape 2 : Encoder les credentials en base64

**Sur Mac/Linux :**
```bash
cat path/to/your-service-account-key.json | base64
```

**Sur Windows (PowerShell) :**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\your-service-account-key.json"))
```

**Ou en ligne :**
- Allez sur https://www.base64encode.org/
- Collez le contenu JSON complet
- Cliquez sur "Encode"
- Copiez le résultat

### Étape 3 : Configurer dans Railway

1. Allez dans votre projet Railway
2. Sélectionnez le service **backend**
3. Allez dans **Variables**
4. Ajoutez/modifiez ces variables :

```
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
GOOGLE_CLOUD_CREDENTIALS=<le-json-encodé-en-base64>
GOOGLE_CLOUD_LOCATION=us-central1
```

**Important :**
- `GOOGLE_CLOUD_PROJECT_ID` : L'ID de votre projet Google Cloud (ex: `my-project-123456`)
- `GOOGLE_CLOUD_CREDENTIALS` : Le contenu JSON complet du service account encodé en base64 (sans retours à la ligne)
- `GOOGLE_CLOUD_LOCATION` : La région (généralement `us-central1`)

### Étape 4 : Activer l'API Gemini

1. Allez dans [Google Cloud Console](https://console.cloud.google.com/)
2. Allez dans **APIs & Services** → **Library**
3. Cherchez "Vertex AI API" ou "Generative Language API"
4. Cliquez sur **Enable**

### Étape 5 : Redéployer

Après avoir ajouté les variables :
1. Railway redéploiera automatiquement
2. Ou cliquez sur **Deploy** → **Redeploy**

## 🔍 Vérification

Après le redéploiement, vérifiez les logs Railway. Vous devriez voir :

```
[GeminiFlashService] Gemini 2.5 Flash Image service initialized
```

Au lieu de :
```
[GeminiFlashService] Failed to initialize Gemini Flash service
```

## 📝 Exemple de fichier JSON de service account

Le fichier JSON devrait ressembler à ça :

```json
{
  "type": "service_account",
  "project_id": "my-project-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "my-service-account@my-project-123456.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## ⚠️ Sécurité

- **Ne partagez jamais** votre fichier JSON de service account
- **Ne commitez jamais** le fichier JSON dans Git
- Utilisez toujours `GOOGLE_CLOUD_CREDENTIALS` (base64) sur Railway, pas `GOOGLE_APPLICATION_CREDENTIALS` (chemin de fichier)

## 🎯 Permissions requises

Le service account doit avoir ces rôles :
- **Vertex AI User** (`roles/aiplatform.user`)
- Ou **Vertex AI Service Agent** (`roles/aiplatform.serviceAgent`)

Pour les ajouter :
1. Allez dans **IAM & Admin** → **IAM**
2. Trouvez votre service account
3. Cliquez sur **Edit**
4. Ajoutez le rôle **Vertex AI User**

## 🐛 Si ça ne fonctionne toujours pas

1. Vérifiez que le JSON est valide (pas de retours à la ligne dans le base64)
2. Vérifiez que `GOOGLE_CLOUD_PROJECT_ID` correspond au `project_id` dans le JSON
3. Vérifiez que l'API Vertex AI est activée
4. Vérifiez les logs Railway pour d'autres erreurs
