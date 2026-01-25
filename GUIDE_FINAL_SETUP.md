# 🚀 Guide Final - Configuration Complète

## ✅ Ce qui est déjà fait

1. ✅ Crédits initiaux : 100 pour nouveaux comptes
2. ✅ Endpoint API : `/api/v1/credits/add` créé
3. ✅ Gestion d'erreurs : Améliorée pour Redis
4. ✅ Validation DTO : Corrigée pour accepter tous les champs

## 🔧 Ce qu'il faut faire maintenant

### Étape 1 : Configurer Redis sur Railway

**Redis est nécessaire pour la file d'attente des jobs de génération.**

1. Allez sur **Railway** → votre projet
2. Cliquez sur **"+ New"** (en haut à droite)
3. Sélectionnez **"Database"**
4. Choisissez **"Add Redis"**
5. Railway créera automatiquement :
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
6. Ces variables seront automatiquement disponibles pour votre service backend

### Étape 2 : Pousser le code vers GitHub

```bash
cd /Users/quentin/Documents/Mascot
git add -A
git commit -m "Complete setup: Fix Redis handling, add credits endpoint, set initial credits to 100"
git push
```

Railway redéploiera automatiquement.

### Étape 3 : Vérifier que tout fonctionne

1. **Vérifier les crédits** :
   ```bash
   curl -X GET "https://mascot-production.up.railway.app/api/v1/credits/balance" \
     -H "Authorization: Bearer VOTRE_TOKEN"
   ```

2. **Tester la génération dans Figma** :
   - Ouvrez Figma
   - Lancez le plugin "Mascot"
   - Connectez-vous avec votre token
   - Générez un mascot

## 📋 Checklist

- [ ] Redis ajouté sur Railway
- [ ] Code poussé vers GitHub
- [ ] Railway a redéployé (vérifier dans Railway → Deployments)
- [ ] Crédits vérifiés (100 crédits pour test@mascot.app)
- [ ] Génération testée dans Figma

## 🔍 Vérification des logs

Si quelque chose ne fonctionne pas :

1. Railway → votre service backend → **"Deployments"**
2. Cliquez sur **"View logs"** du dernier déploiement
3. Cherchez les erreurs

## ⚠️ Problèmes courants

### Erreur 500 "Internal server error"
- **Cause** : Redis non configuré
- **Solution** : Ajouter Redis sur Railway (Étape 1)

### Erreur 403 "Insufficient credits"
- **Cause** : Crédits à 0
- **Solution** : Vérifier dans Railway → Postgres → users table

### Erreur de connexion Redis
- **Cause** : Variables Redis mal configurées
- **Solution** : Vérifier Railway → Variables → REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

## 🎯 Résultat attendu

Une fois tout configuré :
- ✅ Les crédits sont à 100
- ✅ La génération de mascot fonctionne
- ✅ Les images sont générées et affichées dans Figma
- ✅ Les jobs sont traités via Redis/BullMQ
