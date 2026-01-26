# 🔍 Vérifier les quotas Google Cloud Vertex AI

## 📍 Lien direct vers les quotas

### Pour votre projet `mascot-485416` :
https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=mascot-485416

**Ou** pour voir tous les quotas :
https://console.cloud.google.com/iam-admin/quotas?project=mascot-485416

## 📋 Étapes détaillées

### 1. Aller dans Google Cloud Console

1. Allez sur https://console.cloud.google.com
2. Sélectionnez votre projet `mascot-485416`

### 2. Accéder aux quotas

**Méthode 1 : Via IAM & Admin**
1. Menu ☰ → **IAM & Admin** → **Quotas**
2. Dans la barre de recherche, tapez : `Gemini` ou `Vertex AI`
3. Cherchez les quotas liés à :
   - `Gemini 2.5 Flash Image`
   - `Vertex AI API`
   - `Generative AI`

**Méthode 2 : Via APIs & Services**
1. Menu ☰ → **APIs & Services** → **Quotas**
2. Filtrez par service : `Vertex AI API`
3. Cherchez les quotas pour `Gemini 2.5 Flash Image`

### 3. Quotas à vérifier

Cherchez ces quotas spécifiques :

1. **Requests per minute** (Requêtes par minute)
   - Limite typique : 60-300 requêtes/minute
   - Si dépassé → erreur 429

2. **Requests per day** (Requêtes par jour)
   - Limite typique : 1000-10000 requêtes/jour
   - Si dépassé → erreur 429

3. **Tokens per minute** (Tokens par minute)
   - Limite selon votre plan

## 🔍 Comment lire les quotas

- **Limit** : La limite maximale
- **Usage** : L'utilisation actuelle
- **% Used** : Le pourcentage utilisé

Si vous voyez **100%** ou proche, c'est normal d'avoir des erreurs 429.

## ⚙️ Augmenter les quotas (si nécessaire)

1. Cliquez sur le quota que vous voulez augmenter
2. Cliquez sur **Edit Quotas**
3. Remplissez le formulaire avec votre nouvelle limite demandée
4. Google examinera votre demande (peut prendre quelques jours)

## 📝 Quotas par défaut (gratuit)

Pour le plan gratuit de Google Cloud :
- **60 requêtes/minute** pour Gemini 2.5 Flash Image
- **1000 requêtes/jour** environ

## 🎯 Solution rapide

Si vous avez atteint la limite :
1. **Attendez 2-3 minutes** (les quotas se réinitialisent progressivement)
2. **Réduisez le nombre de variations** (3 variations = 3 requêtes simultanées)
3. **Espacez les générations** (ne générez pas plusieurs mascots d'affilée)

## 🔗 Liens utiles

- **Quotas Vertex AI** : https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=mascot-485416
- **Tous les quotas** : https://console.cloud.google.com/iam-admin/quotas?project=mascot-485416
- **Documentation erreur 429** : https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429
