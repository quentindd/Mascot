# Poses : Replicate uniquement (référence image + prompt)

Le backend génère les poses **uniquement avec Replicate** : une image de la mascotte de base + un prompt décrivant la nouvelle pose.

## Provider : Replicate (prunaai/flux-kontext-fast par défaut)

- **Coût** : variable selon le modèle (~0,01–0,06 $/génération)
- **Activation** : définir `REPLICATE_API_TOKEN` (token depuis [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens))
- **Modèle par défaut** : [prunaai/flux-kontext-fast](https://replicate.com/prunaai/flux-kontext-fast) (Kontext ultra-rapide, mascottes/cartoons). Configurable via `REPLICATE_POSE_MODEL` sur Railway ou en local.
- **Comportement** : envoi de l’image mascotte (fullBody ou avatar) + prompt au modèle Replicate ; le modèle conserve le personnage et applique la pose demandée.

Sans `REPLICATE_API_TOKEN`, la génération de poses échoue (erreur explicite). La mascotte doit avoir au moins une image (fullBody, avatar ou squareIcon).

## Workflow recommandé (utilisateur)

1. **Créer la base** : créer la mascotte (Create) avec un prompt détaillé. Sauvegarder.
2. **Modifier la pose** : dans Poses, saisir un prompt du type « lève le bras droit, sourire » ou « assis, main sur la joue ». Le backend envoie l’image de la mascotte + ce prompt au modèle.
3. **Vérifier** : contrôler proportions et couleurs sur la sortie.
4. **Figma** : le plugin récupère les poses et permet « Insert in Figma » (image PNG sur le canvas).

## Variables d’environnement

| Variable | Rôle |
|----------|------|
| `REPLICATE_API_TOKEN` | **Requis** pour les poses. Token depuis [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens). |
| `REPLICATE_POSE_MODEL` | Optionnel. Défaut : `prunaai/flux-kontext-fast`. Autres : `black-forest-labs/flux-kontext-pro`, `bytedance/seededit-3.0`, `sdxl-based/consistent-character`. |
