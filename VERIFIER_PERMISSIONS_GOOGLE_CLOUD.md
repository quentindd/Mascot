# 🔍 Vérifier les permissions du service account

## ❌ Problème actuel

L'initialisation fonctionne :
- ✅ Credentials décodés correctement
- ✅ VertexAI instance créée
- ❌ Mais erreur d'authentification lors de l'utilisation : "Unable to authenticate your request"

## ✅ Solution : Vérifier les permissions

### 1. Aller dans Google Cloud Console

1. Allez sur https://console.cloud.google.com
2. Sélectionnez votre projet `mascot-485416`
3. Allez dans **IAM & Admin** → **IAM**

### 2. Trouver votre service account

1. Cherchez `mascot-ai-generator@mascot-485416.iam.gserviceaccount.com`
2. Vérifiez qu'il a le rôle **"Vertex AI User"** ou **"Vertex AI Service Agent"**

### 3. Si le rôle n'est pas présent

1. Cliquez sur **"Edit"** (crayon) à droite du service account
2. Cliquez sur **"Add Another Role"**
3. Cherchez et sélectionnez **"Vertex AI User"** (`roles/aiplatform.user`)
4. Cliquez sur **"Save"**

### 4. Vérifier que l'API est activée

1. Allez dans **APIs & Services** → **Library**
2. Cherchez **"Vertex AI API"**
3. Vérifiez qu'elle est **activée** (bouton "Manage" si activée)
4. Si elle n'est pas activée, cliquez sur **"Enable"**

### 5. Attendre quelques secondes

Les changements de permissions peuvent prendre quelques secondes à se propager.

## 🔍 Vérification alternative

Vous pouvez aussi vérifier les permissions directement :

1. Allez dans **IAM & Admin** → **Service Accounts**
2. Cliquez sur `mascot-ai-generator`
3. Allez dans l'onglet **"Permissions"** (Autorisations)
4. Vérifiez que vous voyez **"Vertex AI User"**

## 📝 Rôles requis

Le service account doit avoir au moins un de ces rôles :
- **Vertex AI User** (`roles/aiplatform.user`) - Recommandé
- **Vertex AI Service Agent** (`roles/aiplatform.serviceAgent`)
- **Owner** (`roles/owner`) - Trop permissif, non recommandé

## 🎯 Après avoir ajouté les permissions

1. Attendez 10-30 secondes
2. Testez à nouveau la génération dans Figma
3. Vérifiez les logs Railway

Si les permissions sont correctes, l'erreur devrait disparaître.
