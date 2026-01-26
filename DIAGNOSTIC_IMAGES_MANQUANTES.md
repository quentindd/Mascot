# Diagnostic : Images de mascots manquantes

## 🔍 Problème
Les variations de mascots sont créées mais les images ne s'affichent pas (placeholders "Generating...").

## 📋 Checklist de diagnostic

### 1. Vérifier les logs Railway (Backend)

Dans Railway, allez dans votre service backend → **Deployments** → **View Logs**

Cherchez ces messages :

#### ✅ Si vous voyez ces logs, Redis fonctionne :
```
[JobsService] Successfully enqueued mascot generation for <mascot-id>
[MascotGenerationProcessor] Processing mascot generation: <mascot-id>
[MascotGenerationProcessor] Successfully generated mascot <mascot-id>
```

#### ❌ Si vous voyez ces logs, Redis ne fonctionne PAS :
```
[JobsService] Failed to enqueue mascot generation for <mascot-id>
[MascotsService] X job(s) failed to enqueue. Redis may not be configured.
```

#### ⚠️ Si vous voyez ces logs, les jobs échouent :
```
[MascotGenerationProcessor] Failed to generate mascot <mascot-id>
Gemini Flash service not configured
```

### 2. Vérifier la configuration Redis

Dans Railway :
1. Allez dans votre projet
2. Vérifiez qu'un service **Redis** existe
3. Vérifiez que les variables d'environnement du backend incluent :
   - `REDIS_HOST` (ex: `redis.railway.internal` ou l'URL publique)
   - `REDIS_PORT` (généralement `6379`)
   - `REDIS_PASSWORD` (si requis)

### 3. Vérifier la configuration Google Cloud (Gemini Flash)

Les images sont générées avec Gemini Flash. Vérifiez que :
- `GOOGLE_CLOUD_PROJECT_ID` est défini
- Les credentials Google Cloud sont configurés
- Le service Gemini Flash est activé

### 4. Vérifier les logs du plugin Figma

Dans la console du navigateur (F12), cherchez :
```
[Mascot] Received variations: 3
[Mascot] Checking for images in variations...
[Mascot] Has images: false
[Mascot] Starting to poll for batch variations: batch_xxx
[Mascot] Polling attempt 1/30 for batch: batch_xxx
```

### 5. Vérifier le statut des mascots dans la base de données

Les mascots peuvent avoir ces statuts :
- `PENDING` : Créé mais job pas encore exécuté
- `GENERATING` : Job en cours d'exécution
- `COMPLETED` : Image générée avec succès
- `FAILED` : Génération échouée

## 🔧 Solutions

### Solution 1 : Redis non configuré

Si Redis n'est pas configuré :
1. Créez un service Redis dans Railway
2. Ajoutez les variables d'environnement au backend :
   ```
   REDIS_HOST=<redis-host>
   REDIS_PORT=6379
   REDIS_PASSWORD=<password-si-requis>
   ```
3. Redéployez le backend

### Solution 2 : Jobs en échec

Si les jobs échouent :
1. Vérifiez les logs Railway pour l'erreur exacte
2. Vérifiez la configuration Google Cloud
3. Vérifiez que le service Storage (S3) est configuré

### Solution 3 : Images générées mais non accessibles

Si les images sont générées mais ne s'affichent pas :
1. Vérifiez que les URLs d'images sont correctes dans la base de données
2. Vérifiez que le service Storage (S3/CDN) est accessible
3. Vérifiez les CORS si les images sont sur un autre domaine

## 📊 Commandes SQL utiles

Pour vérifier le statut des mascots récents :

```sql
SELECT id, name, status, "fullBodyImageUrl", "avatarImageUrl", "batchId", "createdAt"
FROM mascots
ORDER BY "createdAt" DESC
LIMIT 10;
```

Pour voir les mascots sans images :

```sql
SELECT id, name, status, "batchId"
FROM mascots
WHERE "fullBodyImageUrl" IS NULL 
  AND "avatarImageUrl" IS NULL
  AND status != 'FAILED'
ORDER BY "createdAt" DESC;
```

## 🎯 Prochaines étapes

1. **Vérifiez les logs Railway** pour voir si les jobs sont exécutés
2. **Vérifiez la configuration Redis** dans Railway
3. **Vérifiez la configuration Google Cloud** (Gemini Flash)
4. **Partagez les logs** que vous trouvez pour un diagnostic plus précis
