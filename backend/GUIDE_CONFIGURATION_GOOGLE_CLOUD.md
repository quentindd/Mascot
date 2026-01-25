# Guide de Configuration Google Cloud pour Gemini 2.5 Flash Image

## 🎯 Objectif

Configurer Google Cloud Vertex AI pour utiliser Gemini 2.5 Flash Image (comme MascotAI.app)

---

## 📋 Étape 1 : Créer un compte Google Cloud

1. Allez sur https://cloud.google.com
2. Cliquez sur **"Commencer gratuitement"** ou **"Se connecter"**
   - *(En anglais: "Get started for free" ou "Sign in")*
3. Créez un compte ou connectez-vous avec votre compte Google

**Note:** Google Cloud offre $300 de crédits gratuits pour les nouveaux comptes.

---

## 📋 Étape 2 : Créer un projet

1. Une fois connecté, allez sur https://console.cloud.google.com
2. En haut à gauche, cliquez sur le sélecteur de projet (à côté du logo Google Cloud)
3. Cliquez sur **"Nouveau projet"** (bouton en haut)
   - *(En anglais: "New Project")*

4. Remplissez le formulaire :
   - **Nom du projet:** `Mascot AI` (ou ce que vous voulez)
     - *(En anglais: "Project name")*
   - **Organisation:** `Aucune organisation` (ou votre organisation si vous en avez une)
     - *(En anglais: "Location: No organization")*

5. Cliquez sur **"Créer"**
   - *(En anglais: "Create")*

6. Attendez quelques secondes (vous verrez une notification "Création du projet en cours...")
7. Une fois créé, sélectionnez votre nouveau projet dans le sélecteur en haut à gauche

---

## 📋 Étape 3 : Activer Vertex AI API

1. Dans la console Google Cloud, allez dans le menu ☰ (hamburger) en haut à gauche
2. Allez dans **"APIs et services"** → **"Bibliothèque"**
   - *(En anglais: "APIs & Services" → "Library")*

3. Dans la barre de recherche en haut, tapez : **"Vertex AI API"**
4. Cliquez sur **"Vertex AI API"** dans les résultats
5. Cliquez sur le bouton **"Activer"** (en haut de la page)
   - *(En anglais: "Enable")*

6. Attendez l'activation (quelques secondes, vous verrez "Activation en cours...")
7. Une fois activé, vous verrez "API activée" avec un message de confirmation

**Alternative:** Utilisez ce lien direct :
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com

---

## 📋 Étape 4 : Créer un Service Account (Compte de service)

### Version française de l'interface :

1. Dans le menu ☰ (hamburger), allez dans **"IAM et administration"** → **"Comptes de service"**
   - *(En anglais: "IAM & Admin" → "Service Accounts")*

2. Cliquez sur **"Créer un compte de service"** (bouton en haut)
   - *(En anglais: "Create Service Account")*

3. Remplissez le formulaire :
   - **Nom du compte de service:** `mascot-ai-generator`
   - **ID du compte de service:** (auto-généré, vous pouvez le laisser tel quel)
   - **Description:** `Compte de service pour la génération d'images Mascot AI`
   - *(En anglais: "Service account name", "Service account ID", "Description")*

4. Cliquez sur **"Créer et continuer"**
   - *(En anglais: "Create and Continue")*

### 4.1 : Accorder les permissions

1. Dans la section **"Accorder à ce compte de service l'accès au projet"**
   - *(En anglais: "Grant this service account access to project")*

2. Cliquez sur **"Ajouter un rôle"** ou **"Sélectionner un rôle"**
   - *(En anglais: "Select a role")*

3. Dans la liste déroulante, cherchez et sélectionnez :
   - **"Utilisateur Vertex AI"** ou **"Vertex AI User"**
   - *(Vous pouvez aussi taper "Vertex" dans la barre de recherche pour filtrer)*

4. Cliquez sur **"Continuer"**
   - *(En anglais: "Continue")*

5. Cliquez sur **"Terminé"** ou **"Done"**
   - *(En anglais: "Done")*

**Note:** Si vous ne voyez pas "Utilisateur Vertex AI", cherchez :
- `Vertex AI User` (nom anglais)
- Ou `roles/aiplatform.user` (ID du rôle)

---

## 📋 Étape 5 : Créer et télécharger une clé JSON

1. Dans la liste des **Comptes de service**, cliquez sur celui que vous venez de créer (`mascot-ai-generator`)
   - *(En anglais: "Service Accounts")*

2. Allez dans l'onglet **"Clés"** (en haut de la page)
   - *(En anglais: "Keys")*

3. Cliquez sur **"Ajouter une clé"** → **"Créer une nouvelle clé"**
   - *(En anglais: "Add Key" → "Create new key")*

4. Sélectionnez **"JSON"** dans le menu déroulant
   - *(C'est généralement l'option par défaut)*

5. Cliquez sur **"Créer"**
   - *(En anglais: "Create")*

6. **Le fichier JSON sera téléchargé automatiquement** dans votre dossier Téléchargements
   - **⚠️ GARDEZ-LE PRÉCIEUSEMENT !** Ce fichier contient vos credentials.

**⚠️ IMPORTANT:** Ce fichier contient vos credentials. Ne le partagez JAMAIS publiquement.

---

## 📋 Étape 6 : Encoder la clé en Base64 (pour Railway)

Pour utiliser sur Railway, vous devez encoder le JSON en Base64 :

### Sur Mac/Linux :

```bash
# Remplacez le chemin par celui de votre fichier téléchargé
cat ~/Downloads/mascot-ai-*.json | base64
```

### Sur Windows (PowerShell) :

```powershell
# Remplacez le chemin par celui de votre fichier téléchargé
$content = Get-Content "C:\Users\YourName\Downloads\mascot-ai-*.json" -Raw
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
```

**Copiez le résultat** (c'est une très longue chaîne de caractères).

---

## 📋 Étape 7 : Obtenir le Project ID

1. Dans la console Google Cloud, allez dans le menu ☰ → **"IAM et administration"** → **"Paramètres"**
   - *(En anglais: "IAM & Admin" → "Settings")*

2. Vous verrez **"ID du projet"** dans la section "Informations sur le projet"
   - *(En anglais: "Project ID")*
   - Exemple : `mascot-ai-123456`

3. **Copiez cet ID du projet** (cliquez sur l'icône de copie à côté, ou sélectionnez et copiez)

---

## 📋 Étape 8 : Configurer les variables d'environnement

### Pour le développement local :

Créez/modifiez `.env` dans `backend/` :

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/votre/fichier.json
GOOGLE_CLOUD_LOCATION=us-central1
```

**Exemple :**
```env
GOOGLE_CLOUD_PROJECT_ID=mascot-ai-123456
GOOGLE_APPLICATION_CREDENTIALS=/Users/quentin/Downloads/mascot-ai-123456-abc123.json
GOOGLE_CLOUD_LOCATION=us-central1
```

### Pour Railway (Production) :

1. Allez sur votre projet Railway
2. Onglet **"Variables"**
3. Ajoutez ces variables :

```env
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
GOOGLE_CLOUD_CREDENTIALS=<votre-json-encodé-en-base64>
GOOGLE_CLOUD_LOCATION=us-central1
```

**Exemple :**
```env
GOOGLE_CLOUD_PROJECT_ID=mascot-ai-123456
GOOGLE_CLOUD_CREDENTIALS=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwiY2xpZW50X2VtYWlsIjoi...
GOOGLE_CLOUD_LOCATION=us-central1
```

---

## 📋 Étape 9 : Activer la facturation (si nécessaire)

**Note:** Gemini 2.5 Flash Image nécessite une facturation activée (même avec les crédits gratuits).

1. Dans le menu ☰, allez dans **"Facturation"**
   - *(En anglais: "Billing")*

2. Si vous n'avez pas de compte de facturation :
   - Cliquez sur **"Lier un compte de facturation"** ou **"Créer un compte de facturation"**
     - *(En anglais: "Link a billing account" ou "Create billing account")*
   - Suivez les instructions (vous devrez entrer vos informations de carte bancaire)
   - **Les $300 de crédits gratuits seront appliqués automatiquement** après la création
   - Vous ne serez pas facturé tant que vous n'avez pas utilisé tous vos crédits gratuits

**Coûts estimés :**
- Gemini 2.5 Flash Image : ~$0.005-0.01 par image
- Avec $300 de crédits : ~30,000-60,000 images gratuites

---

## 📋 Étape 10 : Tester la configuration

### Test local :

```bash
cd backend
npm run start:dev
```

Puis testez la génération via l'API ou le plugin Figma.

### Vérifier les logs :

Si vous voyez :
```
[GeminiFlashService] Gemini 2.5 Flash Image service initialized
```

✅ **C'est bon !**

Si vous voyez :
```
[GeminiFlashService] Failed to initialize Gemini Flash service: ...
```

❌ Vérifiez vos credentials et Project ID.

---

## 🔍 Dépannage

### Je ne trouve pas "Utilisateur Vertex AI" dans la liste des rôles

**Solution 1 :** Tapez directement dans la barre de recherche :
- `Vertex AI User` (en anglais)
- Ou `aiplatform.user` (ID du rôle)

**Solution 2 :** Filtrez par catégorie :
- Sélectionnez **"Vertex AI"** dans les filtres de catégorie
- Puis cherchez **"Utilisateur"** ou **"User"**

**Solution 3 :** Utilisez le rôle complet :
- Cherchez : `roles/aiplatform.user`
- C'est l'ID complet du rôle

### Erreur : "Permission denied" / "Permission refusée"

**Solution :** 
1. Vérifiez que le Service Account a bien le rôle **"Utilisateur Vertex AI"** ou **"Vertex AI User"**
2. Allez dans **"IAM et administration"** → **"IAM"**
3. Cherchez votre compte de service dans la liste
4. Vérifiez qu'il a bien le rôle `roles/aiplatform.user`

### Erreur : "Project not found" / "Projet introuvable"

**Solution :** 
- Vérifiez que `GOOGLE_CLOUD_PROJECT_ID` contient l'**ID du projet** (pas le nom)
- L'ID ressemble à : `mascot-ai-123456` (avec des chiffres)
- Pour le trouver : Menu ☰ → **"IAM et administration"** → **"Paramètres"** → **"ID du projet"**

### Erreur : "API not enabled" / "API non activée"

**Solution :** 
1. Allez dans **"APIs et services"** → **"Bibliothèque"**
2. Cherchez **"Vertex AI API"**
3. Vérifiez qu'elle est **"Activée"** (bouton vert)
4. Si elle est désactivée, cliquez sur **"Activer"**

### Erreur : "Billing not enabled" / "Facturation non activée"

**Solution :** 
1. Allez dans **"Facturation"** dans le menu ☰
2. Si vous voyez "Aucun compte de facturation", cliquez sur **"Créer un compte de facturation"**
3. Suivez les instructions (carte bancaire requise, mais crédits gratuits appliqués automatiquement)

### Je ne vois pas les mêmes options que dans le guide

**Solution :** 
- L'interface Google Cloud peut varier légèrement selon la langue et la version
- Cherchez les équivalents français des termes anglais
- Utilisez les liens directs fournis dans le guide
- Les IDs techniques (comme `roles/aiplatform.user`) fonctionnent dans toutes les langues

---

## 📊 Coûts

### Gemini 2.5 Flash Image

- **Par image (1024×1024):** ~$0.005-0.01
- **4 variations:** ~$0.02-0.04
- **1000 images:** ~$5-10

### Comparaison

| Modèle | Coût/image | Qualité | Vitesse |
|--------|------------|---------|---------|
| Gemini 2.5 Flash | $0.005-0.01 | ⭐⭐⭐⭐ | ⚡⚡⚡ |
| Imagen 4 | $0.01-0.02 | ⭐⭐⭐⭐⭐ | ⚡⚡ |

---

## ✅ Checklist finale

- [ ] Compte Google Cloud créé
- [ ] Projet créé
- [ ] Vertex AI API activée
- [ ] Service Account créé avec rôle "Vertex AI User"
- [ ] Clé JSON téléchargée
- [ ] Variables d'environnement configurées
- [ ] Facturation activée (si nécessaire)
- [ ] Test de génération réussi

---

## 🚀 Une fois configuré

Votre backend utilisera **exactement le même modèle et la même structure de prompt que MascotAI.app** !

**Résultat attendu :** Qualité et résultats identiques à MascotAI.app 🎯
