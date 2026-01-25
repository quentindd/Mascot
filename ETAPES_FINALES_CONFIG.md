# Étapes Finales - Configuration Google Cloud

## ✅ Ce que vous avez déjà

- ✅ Compte de service créé : `mascot-ai-generator`
- ✅ Rôle "Utilisateur Vertex AI" ajouté
- ✅ Fichier JSON téléchargé

## 📋 Prochaines étapes

### Étape 1 : Encoder le JSON en Base64

#### Option A : Script automatique (Mac/Linux)

1. Ouvrez le Terminal
2. Exécutez :
```bash
cd /Users/quentin/Documents/Mascot
./scripts/encode-google-credentials.sh ~/Downloads/mascot-ai-*.json
```

*(Remplacez le chemin par l'emplacement réel de votre fichier JSON)*

#### Option B : Commande manuelle

```bash
# Remplacez le chemin par votre fichier
cat ~/Downloads/mascot-ai-*.json | base64
```

**Copiez TOUTE la sortie** (c'est une très longue chaîne de caractères).

#### Option C : En ligne (si vous préférez)

1. Allez sur https://www.base64encode.org/
2. Collez le contenu de votre fichier JSON
3. Cliquez sur "Encode"
4. Copiez le résultat

---

### Étape 2 : Obtenir le Project ID

D'après votre email de service account, votre Project ID est probablement : **`mascot-485416`**

**Pour confirmer :**
1. Ouvrez votre fichier JSON téléchargé
2. Cherchez la ligne : `"project_id": "mascot-485416"`
3. C'est votre Project ID

---

### Étape 3 : Configurer les variables d'environnement

#### Pour Railway (Production) :

1. Allez sur votre projet Railway
2. Onglet **"Variables"**
3. Ajoutez ces 3 variables :

```env
GOOGLE_CLOUD_PROJECT_ID=mascot-485416
GOOGLE_CLOUD_CREDENTIALS=<collez la valeur Base64 ici>
GOOGLE_CLOUD_LOCATION=us-central1
```

**Important :**
- `GOOGLE_CLOUD_CREDENTIALS` = la très longue chaîne Base64 (sans espaces, tout collé)
- `GOOGLE_CLOUD_PROJECT_ID` = `mascot-485416` (ou celui dans votre JSON)

#### Pour le développement local :

Créez/modifiez `backend/.env` :

```env
GOOGLE_CLOUD_PROJECT_ID=mascot-485416
GOOGLE_APPLICATION_CREDENTIALS=/Users/quentin/Downloads/mascot-ai-*.json
GOOGLE_CLOUD_LOCATION=us-central1
```

*(Remplacez le chemin par l'emplacement réel de votre fichier JSON)*

---

### Étape 4 : Activer la facturation (si nécessaire)

1. Dans Google Cloud Console, menu ☰ → **"Facturation"**
2. Si vous voyez "Aucun compte de facturation" :
   - Cliquez sur **"Créer un compte de facturation"**
   - Suivez les instructions (carte bancaire requise)
   - Les $300 de crédits gratuits seront appliqués automatiquement

**Note :** Gemini 2.5 Flash nécessite la facturation activée (même avec crédits gratuits).

---

### Étape 5 : Tester

1. Redémarrez votre backend
2. Générez un mascot via l'API ou le plugin Figma
3. Vérifiez les logs pour voir :
   ```
   [GeminiFlashService] Gemini 2.5 Flash Image service initialized
   ```

---

## 🔍 Vérification rapide

### Vérifier que tout est configuré :

```bash
# Dans backend/
cat .env | grep GOOGLE
```

Vous devriez voir les 3 variables.

### Tester la connexion (optionnel) :

```bash
cd backend
npm run start:dev
```

Regardez les logs au démarrage. Si vous voyez :
```
[GeminiFlashService] Gemini 2.5 Flash Image service initialized
```

✅ **C'est bon !**

---

## 📝 Résumé des valeurs à copier

1. **Project ID** : `mascot-485416` (vérifiez dans votre JSON)
2. **Credentials Base64** : (la très longue chaîne après encodage)
3. **Location** : `us-central1`

---

**Dites-moi quand vous avez :**
- ✅ Encodé le JSON en Base64
- ✅ Trouvé le Project ID dans le JSON
- ✅ Configuré les variables dans Railway

Et je vous aiderai à tester ! 🚀
