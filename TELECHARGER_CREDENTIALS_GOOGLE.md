# 📥 Télécharger les credentials Google Cloud

## 🎯 Objectif

Télécharger le fichier JSON de credentials depuis Google Cloud Console.

---

## 📋 Étapes détaillées

### Étape 1 : Aller dans Google Cloud Console

1. Ouvrez https://console.cloud.google.com
2. **Connectez-vous** avec votre compte Google
3. **Sélectionnez votre projet** (en haut à gauche, à côté du logo Google Cloud)

### Étape 2 : Aller dans Service Accounts

1. Dans le menu ☰ (hamburger) en haut à gauche, cliquez sur
2. **IAM & Admin** → **Service Accounts**
   - *(En français: "IAM et administration" → "Comptes de service")*

### Étape 3 : Trouver votre service account

Vous devriez voir un service account nommé `mascot-ai-generator` (ou similaire).

1. **Cliquez** sur le nom du service account

### Étape 4 : Aller dans l'onglet Keys (Clés)

1. En haut, vous verrez plusieurs onglets : **Détails**, **Autorisations**, **Clés**, etc.
2. Cliquez sur l'onglet **"Clés"** (ou **"Keys"** en anglais)

### Étape 5 : Créer ou utiliser une clé existante

#### Option A : Si vous avez déjà une clé active

Vous verrez une clé avec le statut "Active". Vous pouvez :
- **Utiliser cette clé** : Cliquez sur les 3 points (⋮) à droite → **"Télécharger"** (ou **"Download"**)
- **Créer une nouvelle clé** : Cliquez sur **"Ajouter une clé"** → **"Créer une nouvelle clé"**

#### Option B : Créer une nouvelle clé

1. Cliquez sur le bouton **"Ajouter une clé"** (ou **"Add Key"**)
2. Dans le menu déroulant, choisissez **"Créer une nouvelle clé"** (ou **"Create new key"**)
3. Choisissez le format **JSON**
4. Cliquez sur **"Créer"** (ou **"Create"**)

### Étape 6 : Le fichier se télécharge

Le fichier JSON se télécharge automatiquement dans votre dossier **Téléchargements** (Downloads).

Le nom du fichier ressemble à :
- `mascot-ai-generator-abc123def456.json`
- Ou `votre-projet-abc123.json`

---

## ✅ Vérification

1. Allez dans votre dossier **Téléchargements** (Downloads)
2. Cherchez un fichier `.json` récemment téléchargé
3. Le fichier devrait contenir quelque chose comme :
   ```json
   {
     "type": "service_account",
     "project_id": "votre-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "...",
     ...
   }
   ```

---

## 🚀 Ensuite

Une fois le fichier téléchargé, exécutez :

```bash
cd /Users/quentin/Documents/Mascot
node scripts/encode-google-credentials.js ~/Downloads/nom-du-fichier.json
```

Remplacez `nom-du-fichier.json` par le nom réel de votre fichier.

**Ou** si le fichier est dans Téléchargements, le script devrait le trouver automatiquement :

```bash
node scripts/encode-google-credentials.js
```

---

## 🐛 Problèmes courants

### "Je ne vois pas Service Accounts"

1. Vérifiez que vous êtes dans le bon projet
2. Vérifiez que vous avez les permissions d'administrateur
3. Essayez de chercher "Service Accounts" dans la barre de recherche en haut

### "Je ne vois pas l'onglet Keys"

1. Assurez-vous d'avoir cliqué sur le nom du service account (pas juste survolé)
2. L'onglet "Keys" devrait être visible en haut de la page

### "Le fichier ne se télécharge pas"

1. Vérifiez les paramètres de téléchargement de votre navigateur
2. Regardez dans la barre de téléchargements de votre navigateur
3. Essayez avec un autre navigateur

---

## 💡 Astuce

Si vous avez déjà téléchargé le fichier mais ne savez pas où il est :

```bash
# Chercher tous les fichiers JSON récents dans Téléchargements
ls -lt ~/Downloads/*.json | head -5
```

Cela affiche les 5 fichiers JSON les plus récents.
