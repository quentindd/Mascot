# 🔍 Vérifier la Configuration Redis sur Railway

## Problème : Redis installé mais erreur 500

Si Redis est installé mais que vous avez toujours une erreur 500, c'est probablement que **le service backend n'est pas connecté au service Redis**.

## ✅ Solution : Connecter le Backend à Redis

### Étape 1 : Vérifier que Redis existe

1. Railway → votre projet
2. Vérifiez qu'il y a un service **"Redis"** dans la liste

### Étape 2 : Connecter le Backend à Redis

1. Railway → cliquez sur le service **"Redis"**
2. Allez dans l'onglet **"Variables"**
3. Cherchez **"Connect"** ou **"Private Network"**
4. Railway devrait vous montrer comment connecter d'autres services

**OU**

1. Railway → cliquez sur votre service **backend** (celui qui déploie votre API)
2. Allez dans l'onglet **"Variables"**
3. Vérifiez que ces variables existent :
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`

### Étape 3 : Si les variables n'existent pas

Sur Railway, pour que le backend accède à Redis :

1. Railway → service **Redis** → onglet **"Settings"** ou **"Connect"**
2. Cherchez **"Private Network"** ou **"Service Connection"**
3. Sélectionnez votre service **backend**
4. Railway créera automatiquement les variables dans le backend

**OU manuellement :**

1. Railway → service **Redis** → onglet **"Variables"**
2. Notez les valeurs de :
   - `REDIS_HOST` (ou `REDIS_URL`)
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
3. Railway → service **backend** → onglet **"Variables"**
4. Ajoutez ces 3 variables avec les valeurs notées

## 🔍 Vérifier les Logs

Après avoir connecté Redis, vérifiez les logs :

1. Railway → service **backend** → **"Deployments"** → **"View logs"**
2. Cherchez les lignes qui commencent par `[RedisConfig]`
3. Vous devriez voir :
   ```
   [RedisConfig] Redis configuration: { host: '...', port: 6379, hasPassword: true }
   ```

Si vous voyez `host: 'NOT SET'` ou `host: 'localhost'`, les variables ne sont pas configurées.

## ⚠️ Erreurs courantes

### "Connection refused" ou "ECONNREFUSED"
- **Cause** : REDIS_HOST pointe vers localhost au lieu de l'IP de Redis
- **Solution** : Vérifier que REDIS_HOST contient l'IP/hostname du service Redis Railway

### "Authentication failed"
- **Cause** : REDIS_PASSWORD incorrect ou manquant
- **Solution** : Vérifier que REDIS_PASSWORD correspond à celui du service Redis

### "REDIS_HOST not set"
- **Cause** : Variables Redis non partagées entre services
- **Solution** : Connecter le backend au service Redis (voir Étape 2)
