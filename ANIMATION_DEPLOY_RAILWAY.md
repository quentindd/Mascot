# Animation sur Railway : Replicate Veo uniquement

## Problème actuel (logs)

Si tu vois dans les logs :
- **"Using Gemini Flash fallback (frame-by-frame)"** → le backend déployé est une **ancienne version** qui utilise Gemini (12 images par animation) au lieu de Replicate Veo.
- **429 Too Many Requests (Vertex AI)** → quotas Gemini dépassés à cause de ce fallback.
- **"Cannot find ffmpeg"** → ffmpeg n’était pas installé dans l’image Railway.

## Solution

### 1. Redéployer le backend (code à jour)

Le code actuel utilise **uniquement Replicate Veo 3.1 Fast** pour les animations (une seule requête vidéo par animation, plus de Gemini pour l’animation).

- Pousse le code sur la branche utilisée par Railway (ex. `main`) et laisse Railway redéployer, **ou**
- Déclenche un nouveau déploiement depuis le dashboard Railway.

Après déploiement, les logs doivent afficher :
- **"Using Replicate Veo 3.1 Fast (only provider)..."** (et plus jamais "Gemini Flash fallback").

### 2. Variables d’environnement Railway

- **REPLICATE_API_TOKEN** (obligatoire pour les animations)  
  Sans ce token, la création d’animation renvoie 400 : *"Animation generation requires Replicate (Veo 3.1 Fast). Set REPLICATE_API_TOKEN."*  
  Création du token : https://replicate.com/account/api-tokens

- **REDIS_URL** (ou Redis ajouté comme service)  
  Obligatoire pour que les jobs d’animation soient traités (file BullMQ).

### 3. ffmpeg (déjà corrigé dans le repo)

Le fichier **nixpacks.toml** a été mis à jour avec `nixPkgs = ['nodejs_20', 'ffmpeg']` pour que l’image Railway inclue ffmpeg. Après redéploiement, la conversion WebM et l’extraction de frames depuis la vidéo Veo fonctionnent (plus d’erreur "Cannot find ffmpeg").

## Récap

1. Redéployer le backend (code à jour + nixpacks avec ffmpeg).
2. Vérifier **REPLICATE_API_TOKEN** et **Redis** (REDIS_URL ou service Redis) sur Railway.
3. Relancer une animation : les logs doivent montrer Replicate Veo et plus de fallback Gemini.
