# Analyse de MascotAI.app - Modèles et Prompts

## 🔍 Méthodes d'analyse

### 1. Inspection du code source (Frontend)

Les prompts et modèles sont généralement **cachés côté serveur**, mais on peut trouver des indices :

#### A. Ouvrir les DevTools
1. Ouvrez https://mascotai.app/create
2. Appuyez sur `F12` ou `Cmd+Option+I` (Mac)
3. Onglet **Network** (Réseau)

#### B. Générer un mascot et inspecter les requêtes
1. Remplissez le formulaire
2. Cliquez sur "Generate"
3. Dans l'onglet Network, cherchez les requêtes vers :
   - `/api/` ou `/v1/` ou `/generate`
   - Domaines comme `api.mascotai.app` ou services backend

#### C. Analyser les requêtes HTTP
Cherchez dans les **Request Payload** :
```json
{
  "prompt": "...",
  "style": "kawaii",
  "model": "imagen-4" // ou autre
}
```

### 2. Analyse des patterns visuels

Basé sur la qualité et le style des images générées :

#### Indices possibles :
- **Qualité très élevée + cohérence** → Imagen 4, DALL-E 3, ou Midjourney
- **Style très spécifique** → Modèle fine-tuné (LoRA)
- **Cohérence de personnage native** → Imagen 4 (spécialisé pour ça)
- **Animations fluides** → AnimateDiff, Runway Gen-2/3, ou Pika

### 3. Reverse engineering des prompts

En analysant les fonctionnalités du site, on peut **déduire** la structure des prompts :

#### Structure probable du prompt :

```typescript
function buildPrompt(userInput: {
  prompt: string;
  style: string;
  type: string;
  personality: string;
  accessories: string[];
  brandColors: { primary?: string; secondary?: string };
  negativePrompt?: string;
}): string {
  
  // Base prompt
  let fullPrompt = userInput.prompt;
  
  // Style modifiers
  const styleMap = {
    kawaii: "kawaii style, cute, chibi, big eyes, pastel colors, soft shading",
    minimal: "minimalist design, clean lines, simple shapes, flat colors",
    "3d_pixar": "3D Pixar animation style, smooth surfaces, vibrant colors",
    "3d": "3D render, Blender, C4D, octane render, high detail",
    cartoon: "cartoon style, 2D illustration, vibrant colors, clean lines",
    flat: "flat design, minimal, vector style, no shadows, solid colors",
    pixel: "pixel art, 8-bit, retro game style, low resolution",
    hand_drawn: "hand-drawn illustration, sketch style, artistic"
  };
  
  fullPrompt += `, ${styleMap[userInput.style]}`;
  
  // Type
  if (userInput.type !== 'auto') {
    fullPrompt += `, ${userInput.type} character`;
  }
  
  // Personality
  const personalityMap = {
    friendly: "friendly expression, welcoming, approachable",
    professional: "professional appearance, business-appropriate",
    playful: "playful expression, fun, energetic",
    cool: "cool appearance, modern, stylish",
    energetic: "energetic pose, dynamic, active",
    calm: "calm expression, peaceful, serene"
  };
  fullPrompt += `, ${personalityMap[userInput.personality]}`;
  
  // Accessories
  if (userInput.accessories.length > 0) {
    fullPrompt += `, wearing ${userInput.accessories.join(', ')}`;
  }
  
  // Brand colors
  if (userInput.brandColors.primary) {
    fullPrompt += `, primary color: ${userInput.brandColors.primary}`;
  }
  
  // Mascot-specific requirements
  fullPrompt += ", mascot character, transparent background, high quality, professional illustration, clean edges";
  
  // Negative prompt
  if (userInput.negativePrompt) {
    fullPrompt += `, avoid: ${userInput.negativePrompt}`;
  }
  
  return fullPrompt;
}
```

## 🎯 Hypothèses sur les modèles utilisés

### Image Generation (Mascots)

**Probabilité élevée : Imagen 4**
- ✅ Cohérence de personnage native (sans LoRA visible)
- ✅ Qualité très élevée
- ✅ Support des styles variés
- ✅ Génération rapide
- ✅ Google Cloud (infrastructure solide)

**Alternatives possibles :**
1. **DALL-E 3** (OpenAI)
   - Qualité similaire
   - Mais coûteux et moins de contrôle
   
2. **SDXL + LoRA fine-tuné**
   - Plus économique
   - Mais nécessite fine-tuning pour la cohérence
   
3. **Midjourney API** (si disponible)
   - Qualité artistique élevée
   - Mais moins adapté aux mascots

### Animation Generation

**Probabilité élevée : Runway Gen-2 ou Gen-3**
- ✅ Qualité vidéo exceptionnelle
- ✅ Support alpha channel (transparence)
- ✅ Animations fluides
- ✅ Mentionné dans leur FAQ ("AI intelligently detects body parts")

**Alternatives possibles :**
1. **AnimateDiff + ControlNet**
   - Self-hosted
   - Plus de contrôle
   
2. **Pika Labs**
   - Alternative moins chère
   - Mais moins établi

## 🔬 Comment vérifier expérimentalement

### Test 1 : Analyser les métadonnées EXIF
```bash
# Téléchargez une image générée
curl -O https://mascotai.app/mascot/[id]/image.png

# Analysez les métadonnées
exiftool image.png | grep -i "model\|software\|generator"
```

### Test 2 : Patterns de génération
- **Temps de génération** :
  - < 5 secondes → Imagen 4, DALL-E 3
  - 10-30 secondes → SDXL, Midjourney
  
- **Cohérence entre variations** :
  - Très cohérente → Imagen 4 (native)
  - Variable → SDXL (nécessite LoRA)

### Test 3 : Analyser les erreurs
Si vous voyez des erreurs dans la console :
- `"Vertex AI"` → Imagen 4
- `"OpenAI"` → DALL-E 3
- `"Replicate"` → SDXL
- `"Stability AI"` → SDXL direct

## 📊 Comparaison avec notre implémentation

### Ce qu'on a implémenté :
✅ Structure de prompt identique  
✅ Support des mêmes styles  
✅ Accessories, brand colors, personality  
✅ 4 variations par génération  
✅ Auto-fill from URL  
✅ Evolution / Life stages  

### Différences probables :
- **Modèle** : Eux = Imagen 4 (probable), Nous = Imagen 4 (configuré)
- **Fine-tuning** : Eux = Peut-être un modèle custom, Nous = Standard Imagen 4
- **Animation** : Eux = Runway Gen-3, Nous = À implémenter

## 🛠️ Outils pour analyser

### 1. Browser Extension
- **Wappalyzer** : Détecte les technologies utilisées
- **BuiltWith** : Analyse la stack technique

### 2. Network Analysis
```javascript
// Dans la console du navigateur (sur mascotai.app/create)
// Intercepter les requêtes fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch:', args);
  return originalFetch.apply(this, args);
};
```

### 3. Reverse Proxy
Utiliser un proxy comme **Charles Proxy** ou **mitmproxy** pour inspecter le trafic.

## ⚠️ Limitations

1. **Les prompts sont côté serveur** : Impossible de les voir directement
2. **Les modèles peuvent être obfusqués** : Noms cachés dans le code
3. **Fine-tuning custom** : Peuvent avoir un modèle entraîné spécifiquement
4. **Rate limiting** : Trop de requêtes = IP bloquée

## 💡 Conclusion

**Modèle le plus probable : Imagen 4**
- Basé sur la qualité, la cohérence, et les fonctionnalités
- Parfait pour les mascots
- Google Cloud = infrastructure solide

**Notre implémentation est alignée** avec leur approche, on utilise aussi Imagen 4 ! 🎯
