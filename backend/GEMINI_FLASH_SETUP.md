# Gemini 2.5 Flash Image Setup

## 🎯 Modèle utilisé

**Gemini 2.5 Flash Image** - Exactement comme MascotAI.app

## Configuration

Même configuration que Imagen 4 (même service Google Cloud) :

### Variables d'environnement

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS=<base64-encoded-json>
GOOGLE_CLOUD_LOCATION=us-central1
```

### Installation

```bash
cd backend
npm install @google-cloud/vertexai
```

## Différences avec Imagen 4

| Critère | Gemini 2.5 Flash | Imagen 4 |
|---------|------------------|----------|
| Modèle | `gemini-2.5-flash-image` | `imagegeneration@006` |
| Vitesse | ⚡ Plus rapide | Plus lent |
| Coût | 💰 Moins cher | Plus cher |
| Qualité | ⭐⭐⭐⭐ Très bonne | ⭐⭐⭐⭐⭐ Exceptionnelle |
| Usage | MascotAI.app | Alternative premium |

## Structure des données (comme MascotAI)

Le service accepte exactement la même structure :

```typescript
{
  mascotDetails: "Bird with a bag",  // Prompt principal
  type: "animal",
  style: "3d",
  personality: "friendly",
  bodyParts: ["wings", "cape"],      // Accessories
  color: "purple",                    // Simple color
  brandName: "Test",                  // Brand name
  appDescription: "Travel",           // App context
  negativePrompt: "",
  aspectRatio: "16:9"
}
```

## Prompt construit

Le prompt est construit **exactement** comme MascotAI :

```
Bird with a bag, animal character, 3D render, Blender, C4D, octane render, high detail, professional rendering, friendly expression, welcoming, approachable, purple color, Travel app mascot, mascot for Test, mascot character, transparent background, high quality, professional illustration, clean edges
```

## Utilisation

Le service est automatiquement utilisé par le `MascotGenerationProcessor`. Aucune configuration supplémentaire nécessaire si vous avez déjà configuré Google Cloud pour Imagen 4.

## Fallback

Si Gemini Flash n'est pas disponible, vous pouvez :
1. Vérifier les credentials Google Cloud
2. Utiliser Imagen 4 comme fallback (modifier le processor)

## Coûts

- **Gemini 2.5 Flash**: ~$0.005-0.01 par image
- **Imagen 4**: ~$0.01-0.02 par image

Gemini Flash est **2x moins cher** et **plus rapide**, avec une qualité très proche.
