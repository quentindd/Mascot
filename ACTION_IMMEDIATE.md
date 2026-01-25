# 🎯 Actions Immédiates pour Tout Faire Fonctionner

## ✅ Étape 1 : Configurer Redis sur Railway (OBLIGATOIRE)

**Sans Redis, les jobs de génération ne peuvent pas fonctionner.**

1. Allez sur **https://railway.app**
2. Ouvrez votre projet **"Mascot"**
3. Cliquez sur **"+ New"** (en haut à droite, violet)
4. Sélectionnez **"Database"**
5. Choisissez **"Add Redis"**
6. Railway créera automatiquement Redis et les variables :
   - `REDIS_HOST`
   - `REDIS_PORT` 
   - `REDIS_PASSWORD`
7. Ces variables seront automatiquement disponibles pour votre backend

**⏱️ Temps : 2 minutes**

---

## ✅ Étape 2 : Pousser le Code (si pas encore fait)

```bash
cd /Users/quentin/Documents/Mascot
git push
```

Railway redéploiera automatiquement.

**⏱️ Temps : 1 minute**

---

## ✅ Étape 3 : Vérifier le Déploiement

1. Railway → votre service backend → **"Deployments"**
2. Vérifiez que le dernier déploiement est **"ACTIVE"** (vert)
3. Cliquez sur **"View logs"** pour vérifier qu'il n'y a pas d'erreurs

**⏱️ Temps : 1 minute**

---

## ✅ Étape 4 : Tester dans Figma

1. Ouvrez **Figma**
2. Lancez le plugin **"Mascot"**
3. Connectez-vous avec votre token (`test@mascot.app`)
4. Allez dans l'onglet **"Account"** → Vérifiez que vous avez **100 crédits**
5. Allez dans **"Character"** → Remplissez le formulaire
6. Cliquez sur **"Generate Mascot"**

**Résultat attendu :**
- ✅ Pas d'erreur 500
- ✅ Les 3 variations sont générées
- ✅ Les images apparaissent dans Figma

**⏱️ Temps : 2 minutes**

---

## 🔍 Si ça ne fonctionne toujours pas

### Vérifier les logs Railway

1. Railway → backend service → **"Deployments"** → **"View logs"**
2. Cherchez les erreurs liées à :
   - Redis (connection refused, etc.)
   - Google Cloud (credentials, etc.)
   - Database (connection, etc.)

### Vérifier les variables d'environnement

Railway → backend service → **"Variables"** → Vérifiez :
- ✅ `REDIS_HOST` existe (si Redis ajouté)
- ✅ `REDIS_PORT` existe
- ✅ `REDIS_PASSWORD` existe
- ✅ `GOOGLE_CLOUD_PROJECT_ID` = `mascot-485416`
- ✅ `GOOGLE_CLOUD_CREDENTIALS` existe
- ✅ `GOOGLE_CLOUD_LOCATION` = `us-central1`

---

## 📊 Résumé des Modifications

✅ **Crédits** : 100 par défaut pour nouveaux comptes
✅ **Endpoint API** : `/api/v1/credits/add` pour ajouter des crédits
✅ **Gestion Redis** : Ne fait plus échouer la requête si Redis n'est pas disponible
✅ **Validation DTO** : Corrigée pour accepter tous les champs
✅ **UI simplifiée** : Retiré variations choice, accessories, advanced mode

---

## 🎉 Une fois tout configuré

Vous devriez pouvoir :
- ✅ Générer des mascots (3 variations)
- ✅ Voir les images dans Figma
- ✅ Gérer vos crédits
- ✅ Tout fonctionne sans erreurs
