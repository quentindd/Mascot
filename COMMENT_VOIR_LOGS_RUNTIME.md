# 📋 Comment Voir les Logs Runtime (Erreurs 500)

## ⚠️ Important : Logs de Build vs Logs Runtime

Les logs que vous venez de voir sont les **logs de build** (compilation). Pour voir l'erreur 500, il faut voir les **logs runtime** (exécution).

## 🔍 Étapes pour Voir les Logs Runtime

### Option 1 : Via l'Interface Railway (Recommandé)

1. Railway → votre service **backend**
2. Onglet **"Deployments"** (en haut)
3. Cliquez sur le déploiement **ACTIVE** (celui avec le badge vert)
4. Cliquez sur **"View Logs"** ou **"Logs"**
5. Vous verrez les logs en temps réel

### Option 2 : Via l'Onglet "Metrics"

1. Railway → votre service **backend**
2. Onglet **"Metrics"** (en haut)
3. Cherchez **"Logs"** ou **"View Logs"**

### Option 3 : Via Railway CLI

```bash
railway logs --service backend
```

## 🎯 Ce qu'il faut chercher dans les logs

Une fois que vous testez la génération dans Figma, cherchez dans les logs :

1. **Erreurs récentes** (juste après votre test)
2. Lignes qui contiennent :
   - `[MascotsController] Error`
   - `[MascotsService] Error`
   - `[JobsService] Failed`
   - `[RedisConfig]`
   - `Error:` ou `Exception:`

## 📝 Exemple de ce que vous devriez voir

Quand vous générez un mascot, vous devriez voir dans les logs :

```
[MascotsController] Creating mascot for user: ...
[MascotsService] Error in create: [ERREUR ICI]
[MascotsController] Error creating mascot: [ERREUR ICI]
```

**Copiez cette erreur complète** et partagez-la avec moi.

## ⚡ Action Immédiate

1. **Testez la génération** dans Figma (générez un mascot)
2. **Immédiatement après**, allez voir les logs runtime Railway
3. **Cherchez l'erreur** la plus récente
4. **Copiez l'erreur complète** et partagez-la

Cela me permettra de voir exactement quelle est l'erreur 500 !
