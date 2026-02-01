# OpenAI / Replicate pour la génération de logos (GPT Image 1.5)

La génération de logos « mascotte + inspiration + couleurs » peut utiliser **OpenAI GPT Image 1.5** pour de meilleurs résultats. Deux options :

1. **OpenAI API** : variable `OPENAI_API_KEY` → appel direct à l’API OpenAI (images/edits).
2. **Replicate** : variable `REPLICATE_API_TOKEN` → modèle [openai/gpt-image-1.5](https://replicate.com/openai/gpt-image-1.5) sur Replicate (même modèle, facturation Replicate).

**Ordre de priorité** (sans image de référence) : OpenAI API → Replicate (gpt-image-1.5) → Gemini.

## Configuration

### Option A : OpenAI API (OPENAI_API_KEY)

1. Va sur [platform.openai.com](https://platform.openai.com) → API keys → Create new secret key.  
2. **Variable** : `OPENAI_API_KEY=sk-...` (local `.env` ou Railway Variables).  
3. Redéploie si besoin.

### Option B : Replicate (openai/gpt-image-1.5)

1. Va sur [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) → crée un token si besoin.  
2. **Variable** : `REPLICATE_API_TOKEN=r8_...` (tu l’as déjà si tu utilises Replicate pour les poses / rembg / Veo).  
3. Aucune clé OpenAI nécessaire : le backend appelle le modèle [openai/gpt-image-1.5](https://replicate.com/openai/gpt-image-1.5) sur Replicate.  
4. Redéploie si tu viens d’ajouter le token.

## Coût (GPT Image 1.5, 1024×1024)

Prix par image (source : [OpenAI Pricing](https://platform.openai.com/docs/pricing)) :

| Qualité | 1024×1024 (par image) |
|--------|------------------------|
| Low    | ~0,009 $ (~0,008 €)   |
| Medium | ~0,034 $ (~0,03 €)    |
| **High** (utilisée pour les logos) | **~0,133 $ (~0,12 €)** |

Pour un logo pack (1 image générée puis redimensionnée en plusieurs tailles), **1 génération ≈ 0,13 $** en qualité High.

Tu peux garder ta facturation actuelle en crédits (ex. 10 crédits par logo pack) ; le coût réel backend par pack est d’environ **0,13 $** si tu utilises OpenAI pour les logos.

## Ordre de priorité (sans référence image)

1. **`OPENAI_API_KEY` défini** → OpenAI API (images/edits).  
2. **`REPLICATE_API_TOKEN` défini** (sans clé OpenAI) → Replicate **openai/gpt-image-1.5** (mascotte + prompt).  
3. **Sinon** → Gemini (mascotte + prompt).

En résumé : pour utiliser **Replicate** pour les logos, assure-toi d’avoir `REPLICATE_API_TOKEN` et de ne pas définir `OPENAI_API_KEY` si tu veux passer par Replicate. Si les deux sont définis, OpenAI API est utilisé en premier.
