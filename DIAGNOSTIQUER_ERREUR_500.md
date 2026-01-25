# 🔍 Diagnostiquer l'Erreur 500

## ✅ Code amélioré avec logs détaillés

J'ai ajouté :
- ✅ Filtre d'exception global pour capturer toutes les erreurs
- ✅ Logs détaillés dans le controller et service
- ✅ Logs Redis pour voir la configuration

## 📋 Étapes pour diagnostiquer

### Étape 1 : Pousser le code avec les nouveaux logs

```bash
cd /Users/quentin/Documents/Mascot
git add backend/src
git commit -m "Add detailed error logging and exception filter"
git push
```

### Étape 2 : Vérifier les logs Railway

1. Allez sur **Railway** → votre service **backend**
2. Cliquez sur **"Deployments"**
3. Cliquez sur **"View logs"** du dernier déploiement
4. **Cherchez les erreurs** qui commencent par :
   - `[MascotsController] Error creating mascot:`
   - `[MascotsService] Error in create:`
   - `[JobsService] Failed to enqueue:`
   - `[RedisConfig]`

### Étape 3 : Tester à nouveau dans Figma

1. Ouvrez Figma → Plugin Mascot
2. Générez un mascot
3. **Immédiatement après**, allez voir les logs Railway

### Étape 4 : Analyser l'erreur

Les logs vous diront exactement quelle erreur se produit :

#### Si vous voyez : `[RedisConfig] REDIS_HOST not set`
- **Problème** : Variables Redis non configurées
- **Solution** : Vérifier Railway → backend → Variables → REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

#### Si vous voyez : `Connection refused` ou `ECONNREFUSED`
- **Problème** : Redis non accessible
- **Solution** : Vérifier que Redis est connecté au backend (voir VERIFIER_REDIS_RAILWAY.md)

#### Si vous voyez : `[MascotsService] Failed to enqueue job`
- **Problème** : Erreur lors de l'enqueue dans Redis
- **Solution** : Vérifier la connexion Redis

#### Si vous voyez une autre erreur
- **Copiez l'erreur complète** des logs
- Elle vous dira exactement quel est le problème

## 🎯 Actions immédiates

1. **Pousser le code** (pour avoir les logs détaillés)
2. **Tester dans Figma** (générer un mascot)
3. **Vérifier les logs Railway** (voir l'erreur exacte)
4. **Partager l'erreur** des logs pour que je puisse vous aider

## 📝 Exemple de ce que vous devriez voir dans les logs

```
[MascotsController] Creating mascot for user: 33ebf395-ce0a-43e6-9f6d-19ec701d49ee
[MascotsController] DTO: { "name": "...", "prompt": "..." }
[MascotsService] Error in create: [ERREUR EXACTE ICI]
[MascotsController] Error creating mascot: [ERREUR EXACTE ICI]
```

Ces logs vous diront **exactement** quelle est l'erreur !
