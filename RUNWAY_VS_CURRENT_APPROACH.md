# Runway ML vs Approche Actuelle (Gemini Flash)

## 🔄 Différences principales

### Approche actuelle (Gemini Flash frame par frame)

**Processus :**
1. Génère 12 frames individuelles avec Gemini Flash
2. Assemble en sprite sheet PNG
3. Convertit en WebM/MOV avec FFmpeg
4. Génère Lottie JSON

**Avantages :**
- ✅ Pas besoin d'API externe supplémentaire
- ✅ Contrôle total sur chaque frame
- ✅ Coût prévisible (12 appels Gemini = ~$0.12-0.24)
- ✅ Déjà implémenté et fonctionnel

**Inconvénients :**
- ⚠️ Besoin de FFmpeg installé
- ⚠️ Temps de génération plus long (1-2 minutes)
- ⚠️ Cohérence entre frames peut varier
- ⚠️ 12 appels API séparés

---

### Approche Runway ML

**Processus :**
1. Envoie l'image du mascot + prompt à Runway
2. Runway génère directement une vidéo avec alpha
3. Reçoit la vidéo prête à l'emploi
4. Convertit en WebM/MOV si nécessaire (ou utilise directement)

**Avantages :**
- ✅ **Pas besoin de FFmpeg** (sauf conversion format)
- ✅ **Qualité vidéo native** (meilleure cohérence)
- ✅ **Plus rapide** (30-60 secondes vs 1-2 minutes)
- ✅ **Un seul appel API** (plus simple)
- ✅ **Vidéo fluide** (pas de saut entre frames)

**Inconvénients :**
- ⚠️ **Nouvelle dépendance** : API Runway + clé API
- ⚠️ **Coût variable** : ~$0.05-0.10 par seconde
- ⚠️ **Moins de contrôle** : Pas de contrôle frame par frame
- ⚠️ **Limites API** : Rate limits, quotas

---

## 💰 Comparaison des coûts

| Approche | Coût par animation (1 seconde) | Temps | Qualité |
|----------|-------------------------------|-------|---------|
| **Gemini Flash** | ~$0.12-0.24 (12 frames) | 1-2 min | Bonne |
| **Runway ML** | ~$0.05-0.10 (1 vidéo) | 30-60s | Excellente |

**Runway est 2-4x moins cher et plus rapide !**

---

## 🔧 Changements nécessaires pour Runway

### 1. Ajouter le service Runway

Créer `backend/src/modules/ai/runway.service.ts` :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RunwayService {
  private readonly logger = new Logger(RunwayService.name);
  private apiKey: string;
  private baseUrl = 'https://api.runwayml.com/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RUNWAY_API_KEY');
  }

  async generateVideo(options: {
    imageUrl: string;
    prompt: string;
    duration?: number; // seconds
    fps?: number;
    resolution?: number;
    alpha?: boolean;
  }): Promise<Buffer> {
    // Appel API Runway
    // Retourne la vidéo avec alpha
  }
}
```

### 2. Modifier le processor

Au lieu de générer 12 frames, appeler Runway une fois :

```typescript
// Dans animation-generation.processor.ts
const videoBuffer = await this.runwayService.generateVideo({
  imageUrl: mascotImageUrl,
  prompt: `${action} animation, transparent background`,
  duration: 1, // 1 seconde
  fps: 12,
  resolution: resolution,
  alpha: true,
});
```

### 3. Simplifier le processus

- ❌ Plus besoin de générer 12 frames
- ❌ Plus besoin d'assembler sprite sheet
- ❌ Plus besoin de FFmpeg (sauf conversion format)
- ✅ Juste : Runway → Vidéo → Upload

---

## 🎯 Recommandation

### Pour la production : **Runway ML**

**Pourquoi :**
1. **Pas besoin de FFmpeg** (simplifie le déploiement)
2. **Meilleure qualité** (vidéo native)
3. **Plus rapide** (30-60s vs 1-2min)
4. **Moins cher** (2-4x moins cher)
5. **Plus simple** (1 appel API vs 12)

### Garder Gemini Flash comme fallback

Si Runway échoue ou n'est pas disponible, fallback sur Gemini Flash.

---

## 📝 Implémentation hybride (Recommandée)

```typescript
async process(job: Job) {
  // Essayer Runway d'abord
  try {
    if (this.runwayService.isAvailable()) {
      return await this.generateWithRunway(mascot, action);
    }
  } catch (error) {
    this.logger.warn('Runway failed, falling back to Gemini Flash');
  }
  
  // Fallback sur Gemini Flash
  return await this.generateWithGeminiFlash(mascot, action);
}
```

---

## ✅ Avantages de passer à Runway

1. **Simplification** : Pas besoin de FFmpeg
2. **Qualité** : Vidéo native plus fluide
3. **Performance** : Plus rapide
4. **Coût** : Moins cher
5. **Maintenance** : Moins de code à maintenir

---

## ⚠️ Ce qu'il faut faire

1. **Créer compte Runway** : https://runwayml.com
2. **Obtenir API key** : Dans les paramètres du compte
3. **Ajouter service Runway** : Créer le service
4. **Modifier processor** : Utiliser Runway au lieu de Gemini Flash
5. **Tester** : Vérifier que ça fonctionne

---

## 🔄 Migration progressive

On peut garder les deux approches :
- **Runway** : Par défaut (meilleure qualité)
- **Gemini Flash** : Fallback (si Runway indisponible)

Cela donne la meilleure expérience utilisateur !
