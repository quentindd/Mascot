# Guide d'extraction d'informations RÉELLES depuis MascotAI.app

## 🎯 Objectif

Obtenir des informations **100% certaines** sur :
- Le modèle IA utilisé
- Les prompts exacts envoyés
- Les endpoints API
- La structure des requêtes

## 📋 Méthode 1 : Script d'extraction automatique (RECOMMANDÉ)

### Étape 1 : Préparer l'environnement

1. Ouvrez **Chrome** (pas Firefox/Safari pour meilleure compatibilité)
2. Allez sur https://mascotai.app/create
3. Ouvrez les **DevTools** : `F12` ou `Cmd+Option+I` (Mac)

### Étape 2 : Activer le script

1. Onglet **Console** dans DevTools
2. Collez le contenu de `scripts/extract-real-info.js`
3. Appuyez sur **Enter**

Vous verrez :
```
✅ Script d'extraction activé !
```

### Étape 3 : Générer un mascot

1. Remplissez le formulaire sur le site
2. Cliquez sur **"Generate"**
3. Attendez la génération

### Étape 4 : Voir les résultats

Dans la console, tapez :
```javascript
showMascotAIResults()
```

**Les informations RÉELLES seront affichées**, incluant :
- ✅ Modèles détectés dans les requêtes
- ✅ Prompts exacts envoyés
- ✅ Endpoints API utilisés
- ✅ Structure complète des requêtes

### Étape 5 : Exporter les données

Pour sauvegarder :
```javascript
copy(JSON.stringify(window.mascotAIResults, null, 2))
```

Collez dans un fichier `.json` pour analyse.

---

## 📋 Méthode 2 : Inspection manuelle (Network Tab)

### Étape 1 : Ouvrir Network Tab

1. DevTools → Onglet **Network**
2. Cochez **"Preserve log"** (important !)

### Étape 2 : Filtrer les requêtes

Dans la barre de filtre, tapez :
- `api` ou `v1` ou `generate` ou `mascot`

### Étape 3 : Générer un mascot

1. Remplissez le formulaire
2. Cliquez sur **"Generate"**

### Étape 4 : Analyser les requêtes

Pour chaque requête intéressante :

1. **Cliquez sur la requête**
2. Onglet **Headers** :
   - Regardez `Request URL` → endpoint réel
   - Regardez `Request Headers` → clés API, tokens
3. Onglet **Payload** (si POST) :
   - **Copiez TOUT le JSON** → c'est la structure réelle
   - Cherchez `model`, `prompt`, `style`, etc.
4. Onglet **Response** :
   - **Copiez TOUT le JSON** → peut contenir métadonnées
   - Cherchez `metadata.model`, `metadata.prompt`, etc.

### Exemple de ce qu'on cherche :

```json
// Dans Request Payload
{
  "prompt": "...",           // ← PROMPT RÉEL
  "model": "imagen-4",       // ← MODÈLE RÉEL
  "style": "kawaii",
  "accessories": [...],
  ...
}

// Dans Response
{
  "id": "...",
  "imageUrl": "...",
  "metadata": {
    "model": "imagen-4",      // ← MODÈLE CONFIRMÉ
    "prompt": "...",          // ← PROMPT FINAL
    "generatedAt": "..."
  }
}
```

---

## 📋 Méthode 3 : Analyse des métadonnées d'images

### Étape 1 : Télécharger une image générée

1. Générez un mascot
2. Téléchargez l'image (clic droit → Enregistrer)

### Étape 2 : Analyser les métadonnées EXIF

```bash
# Installer exiftool
brew install exiftool  # Mac
# ou télécharger depuis https://exiftool.org/

# Analyser l'image
exiftool mascot-image.png

# Chercher spécifiquement
exiftool mascot-image.png | grep -i "model\|software\|generator\|prompt"
```

**Ce qu'on peut trouver :**
- `Software: Imagen 4` → Modèle confirmé
- `User Comment: {"model": "imagen-4", ...}` → Métadonnées complètes
- `Prompt: ...` → Prompt exact utilisé

---

## 📋 Méthode 4 : Analyse des erreurs (si disponibles)

Parfois, les erreurs révèlent des informations :

1. Ouvrez la console
2. Générez un mascot
3. Si erreur, cherchez :
   - `"Vertex AI"` → Imagen 4
   - `"OpenAI"` → DALL-E
   - `"Replicate"` → SDXL
   - `"Stability AI"` → SDXL direct

---

## 📋 Méthode 5 : Reverse engineering du code source

### Étape 1 : Télécharger le code source

```bash
# Dans DevTools → Sources → Page
# Ou utilisez curl
curl https://mascotai.app/create > page.html
```

### Étape 2 : Chercher des patterns

```bash
# Chercher "model"
grep -i "model" page.html | head -20

# Chercher "imagen" ou "vertex"
grep -i "imagen\|vertex" page.html

# Chercher "prompt"
grep -i "prompt" page.html | head -20
```

**Attention :** Le code est probablement minifié/obfusqué.

---

## 📋 Méthode 6 : Analyse des WebSockets (si utilisés)

1. DevTools → Network → Filtre : **WS** (WebSocket)
2. Si connexion WebSocket :
   - Cliquez dessus
   - Onglet **Messages**
   - Regardez les messages échangés
   - Peut contenir prompts/modèles en temps réel

---

## 🔍 Ce qu'on cherche spécifiquement

### 1. Modèle IA
- `model: "imagen-4"` ou `"imagegeneration@006"`
- `model: "dall-e-3"` ou `"dall-e-2"`
- `model: "sdxl"` ou `"stable-diffusion-xl"`
- Dans headers : `X-Model: ...`

### 2. Prompt exact
- `prompt: "..."` dans Request
- `finalPrompt: "..."` dans Response
- `metadata.prompt: "..."`

### 3. Endpoints API
- `https://api.mascotai.app/v1/generate`
- `https://backend.mascotai.app/api/mascots`
- Ou domaine externe (Google Cloud, OpenAI, etc.)

### 4. Structure complète
- Tous les champs envoyés
- Tous les champs retournés
- Headers d'authentification

---

## ⚠️ Limitations

1. **Modèles côté serveur** : Si le modèle est déterminé côté serveur, il ne sera pas dans les requêtes client
2. **Code obfusqué** : Le JavaScript peut être minifié
3. **Rate limiting** : Trop de requêtes = IP bloquée
4. **Authentification** : Certaines infos nécessitent un compte

---

## ✅ Validation des résultats

Pour être **100% certain**, il faut :

1. ✅ Voir le modèle dans une requête/réponse
2. ✅ Voir le prompt exact dans une requête/réponse
3. ✅ Voir les endpoints réels
4. ✅ Confirmer avec plusieurs générations

**Si vous ne trouvez rien** → Les modèles/prompts sont probablement :
- Déterminés côté serveur uniquement
- Cachés dans du code obfusqué
- Utilisés via un service proxy

---

## 📊 Template de rapport

Après extraction, créez un rapport :

```markdown
# Informations extraites de MascotAI.app

Date: [DATE]
Méthode: [Script/Network/EXIF/etc.]

## Modèle IA détecté
- Source: [Request/Response/Metadata]
- Valeur: [imagen-4 / dall-e-3 / etc.]
- Certitude: [100% / Probable / Incertain]

## Prompt structure
[Coller le prompt exact]

## Endpoints API
- POST https://...
- GET https://...

## Autres informations
[Headers, tokens, etc.]
```

---

## 🚀 Prochaines étapes

Une fois les informations extraites :

1. **Comparer** avec notre implémentation
2. **Ajuster** nos prompts si nécessaire
3. **Valider** que notre modèle est le bon
4. **Optimiser** pour correspondre à leur qualité

---

**Note importante :** Ces méthodes sont légales car elles analysent uniquement les données **publiquement accessibles** via votre navigateur. Vous n'accédez pas à des données privées ou protégées.
