# Configuration Runway ML

## ✅ Implémentation terminée

Le système utilise maintenant **Runway ML en priorité** avec **Gemini Flash en fallback**.

## 🔧 Configuration requise

### 1. Obtenir une API Key Runway

1. Créer un compte sur : https://runwayml.com
2. Aller dans les paramètres → API
3. Générer une nouvelle API key
4. Copier la clé

### 2. Ajouter la variable d'environnement

**Sur Railway (production) :**
```
RUNWAY_API_KEY=your_api_key_here
```

**En local (.env) :**
```
RUNWAY_API_KEY=your_api_key_here
```

### 3. Redémarrer le backend

Après avoir ajouté la variable, redémarrer le backend pour que le service Runway s'initialise.

## 🎯 Comment ça fonctionne

### Priorité 1 : Runway ML (si disponible)

1. ✅ Génère directement une vidéo MOV avec alpha (2 secondes)
2. ✅ Convertit en WebM VP9 avec FFmpeg (si disponible)
3. ✅ Extrait des frames pour sprite sheet et Lottie (optionnel)
4. ✅ Plus rapide (30-60 secondes)
5. ✅ Meilleure qualité (vidéo native)

### Priorité 2 : Gemini Flash (fallback)

Si Runway n'est pas disponible ou échoue :
1. ✅ Génère 12 frames individuelles
2. ✅ Assemble en sprite sheet
3. ✅ Génère Lottie JSON
4. ✅ Convertit en WebM/MOV avec FFmpeg

## 💰 Coûts

| Méthode | Coût par animation | Temps |
|---------|-------------------|-------|
| **Runway** | ~$0.10-0.20 (2 secondes) | 30-60s |
| **Gemini Flash** | ~$0.12-0.24 (12 frames) | 1-2 min |

**Runway est plus rapide et de meilleure qualité !**

## ⚙️ Avantages de Runway

1. ✅ **Pas besoin de FFmpeg** pour assembler les frames
2. ✅ **Vidéo native** (meilleure cohérence)
3. ✅ **Plus rapide** (30-60s vs 1-2min)
4. ✅ **Meilleure qualité** (vidéo fluide)
5. ✅ **2 secondes** (meilleur pour les loops)

## 📝 Notes importantes

### Durée des animations

- **Runway** : Génère 2 secondes (minimum Runway, mieux pour loops)
- **Gemini Flash** : Génère 1 seconde (12 frames à 12fps)

Les deux fonctionnent parfaitement en loop !

### FFmpeg toujours nécessaire

Même avec Runway, FFmpeg est toujours utilisé pour :
- Convertir MOV → WebM (pour Chrome/Firefox)
- Extraire des frames (pour sprite sheet/Lottie)

Mais **pas besoin de FFmpeg pour assembler 12 frames** - c'est le gros avantage !

## 🧪 Tester

1. Ajouter `RUNWAY_API_KEY` dans les variables d'environnement
2. Redémarrer le backend
3. Générer une animation depuis le plugin
4. Vérifier les logs : vous devriez voir `[RunwayService] Generating video...`

## 🔍 Vérifier que Runway est actif

Dans les logs du backend, cherchez :
```
[RunwayService] Runway ML service initialized
```

Si vous voyez :
```
[RunwayService] RUNWAY_API_KEY not set, Runway ML will not be available
```

→ Ajoutez la variable d'environnement et redémarrez.

## 🚨 En cas d'erreur Runway

Si Runway échoue, le système bascule automatiquement sur Gemini Flash. Vous verrez dans les logs :
```
[AnimationGenerationProcessor] Runway generation failed, falling back to Gemini Flash
```

Cela garantit que les animations fonctionnent toujours, même si Runway a un problème !
