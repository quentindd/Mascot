# Guide d'analyse de masko.ai

## Comment intercepter leur modèle IA

### Étape 1 : Ouvrir les DevTools

1. Allez sur https://masko.ai/mascot-generator
2. Ouvrez les DevTools (F12)
3. Allez dans l'onglet **Network**
4. Activez le filtre **XHR** ou **Fetch**

### Étape 2 : Générer une animation

1. Entrez une description de mascot
2. Choisissez un style
3. Cliquez sur "Generate Animation"
4. **Observez les requêtes qui apparaissent**

### Étape 3 : Analyser les requêtes

#### Requêtes à chercher :

1. **Génération de mascot** :
   - URL probable : `/api/mascots` ou `/api/generate`
   - Méthode : `POST`
   - Body : contient le prompt, style, etc.
   - **Response** : peut contenir des infos sur le modèle

2. **Génération d'animation** :
   - URL probable : `/api/animations` ou `/api/mascots/{id}/animate`
   - Méthode : `POST`
   - Body : action, mascotId, etc.
   - **Response** : peut contenir des infos sur le modèle d'animation

3. **Polling du statut** :
   - URL probable : `/api/animations/{id}/status`
   - Méthode : `GET`
   - **Response** : statut de génération

### Étape 4 : Chercher les indices du modèle

Dans les réponses, cherchez :
- `"model": "..."` 
- `"provider": "..."` 
- `"engine": "..."` 
- Headers comme `X-Model` ou `X-Provider`
- URLs d'API tierces (OpenAI, Google, etc.)

### Étape 5 : Analyser les vidéos générées

1. Une fois l'animation générée, inspectez les URLs :
   - `webmVideoUrl`
   - `movVideoUrl`
   - `lottieUrl`

2. Analysez les métadonnées des fichiers :
   ```bash
   # Pour WebM
   ffprobe animation.webm
   
   # Pour MOV
   ffprobe animation.mov
   ```

3. Vérifiez les headers HTTP des vidéos :
   - `Content-Type`
   - `X-Generated-By`
   - `X-Model-Version`

## Script d'inspection automatique

Créez un bookmarklet pour capturer toutes les requêtes :

```javascript
// Collez ceci dans la console du navigateur
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('🔍 Fetch Request:', args[0], args[1]);
    return originalFetch.apply(this, args).then(response => {
      response.clone().json().then(data => {
        console.log('📦 Response Data:', data);
        // Chercher des indices de modèle
        if (data.model || data.provider || data.engine) {
          console.log('🎯 MODEL FOUND:', data.model || data.provider || data.engine);
        }
      }).catch(() => {});
      return response;
    });
  };
  
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    xhr.open = function(method, url, ...args) {
      console.log('🔍 XHR Request:', method, url);
      return originalOpen.apply(this, [method, url, ...args]);
    };
    xhr.addEventListener('load', function() {
      try {
        const data = JSON.parse(this.responseText);
        console.log('📦 XHR Response:', data);
        if (data.model || data.provider || data.engine) {
          console.log('🎯 MODEL FOUND:', data.model || data.provider || data.engine);
        }
      } catch(e) {}
    });
    return xhr;
  };
  
  console.log('✅ Interception activée ! Générez une animation maintenant.');
})();
```

## Ce qu'on peut découvrir

### Modèles possibles :

1. **Pour les images** :
   - Gemini 2.5 Flash (comme nous)
   - Imagen 4
   - DALL-E 3
   - Midjourney (via API)
   - Stable Diffusion XL

2. **Pour les animations** :
   - Génération frame par frame (comme nous)
   - AnimateDiff
   - Runway Gen-2/Gen-3
   - Pika Labs
   - Modèle vidéo direct

### Indices à chercher :

- **Latence** : Si très rapide (< 5s), probablement un modèle optimisé
- **Qualité** : Si très cohérent, probablement un modèle avec LoRA ou fine-tuning
- **Coût** : 25 crédits = probablement plusieurs appels API (12 frames × 2 crédits = 24)

## Analyse des vidéos générées

Une fois que vous avez une animation, analysez-la :

```bash
# Installer ffprobe (fait partie de ffmpeg)
brew install ffmpeg  # macOS
# ou
apt-get install ffmpeg  # Linux

# Analyser une vidéo
ffprobe -v error -show_entries stream=codec_name,codec_long_name,duration,width,height animation.webm

# Vérifier les métadonnées
ffprobe -v error -show_format animation.webm
```

## Résultats attendus

Si vous trouvez :
- `"model": "gemini-2.5-flash"` → Ils utilisent Gemini comme nous
- `"model": "imagen-4"` → Ils utilisent Imagen 4
- `"provider": "openai"` → Ils utilisent DALL-E
- Pas de modèle dans la réponse → Probablement un backend propriétaire

## Alternative : Reverse Engineering

Si les requêtes sont cryptées ou non visibles :

1. **Analyser le JavaScript** :
   - Sources → Chercher `model`, `provider`, `api`
   - Chercher les imports de SDKs (OpenAI, Google, etc.)

2. **Analyser les patterns** :
   - Temps de génération
   - Qualité des résultats
   - Styles supportés

3. **Comparer avec notre implémentation** :
   - Si similaire → Probablement même approche
   - Si très différent → Probablement modèle vidéo direct
