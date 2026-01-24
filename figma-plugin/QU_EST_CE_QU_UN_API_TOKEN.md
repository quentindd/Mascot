# Qu'est-ce qu'un API Token ?

## 🔑 Définition simple

Un **API token** (ou "clé API") est une chaîne de caractères secrète qui permet au plugin Figma de s'authentifier auprès de votre backend et de générer des images.

C'est comme un **mot de passe** que le plugin utilise pour prouver qu'il a le droit d'utiliser votre API.

## 🎯 Pourquoi en avez-vous besoin ?

Sans API token :
- ❌ Le plugin ne peut pas communiquer avec votre backend
- ❌ Vous ne pouvez pas générer de vraies images
- ❌ Vous ne pouvez pas accéder à vos mascots sauvegardés

Avec API token :
- ✅ Le plugin peut authentifier les requêtes
- ✅ Vous pouvez générer de vraies images AI
- ✅ Vos mascots sont sauvegardés dans votre compte
- ✅ Vous pouvez gérer vos crédits

## 📍 Comment obtenir un API token ?

### Option 1 : Backend déployé (Production)

Si votre backend est déjà déployé sur `api.mascot.com` :

1. **Créez un compte** :
   - Allez sur `https://mascot.com/signup`
   - Créez un compte utilisateur

2. **Connectez-vous** :
   - Allez sur `https://mascot.com/login`
   - Connectez-vous avec votre email/mot de passe

3. **Générez un API token** :
   - Allez sur `https://mascot.com/dashboard/api-keys`
   - Cliquez sur "Create API Key"
   - Copiez le token généré

4. **Utilisez-le dans le plugin** :
   - Ouvrez le plugin Figma
   - Cliquez sur "Sign In with API Token"
   - Collez votre token

### Option 2 : Backend local (Développement)

Si vous développez en local et que votre backend tourne sur `localhost:3000` :

#### Étape 1 : Démarrer le backend

```bash
cd backend
npm install
npm run start:dev
```

Le backend devrait démarrer sur `http://localhost:3000`

#### Étape 2 : Créer un compte via l'API

```bash
# Créer un compte
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Réponse attendue :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": { ... }
}
```

#### Étape 3 : Utiliser le JWT token comme API token

Le `accessToken` retourné est votre **API token** ! 

1. Copiez le `accessToken` de la réponse
2. Dans le plugin Figma, cliquez sur "Sign In with API Token"
3. Collez le token

#### Étape 4 : Modifier l'URL de l'API (si backend local)

Si votre backend tourne en local, vous devez modifier l'URL dans le plugin :

**Fichier** : `figma-plugin/src/api/client.ts`

```typescript
// Pour développement local
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Pour production
// const API_BASE_URL = 'https://api.mascot.com/api/v1';
```

⚠️ **Important** : Figma ne peut pas accéder à `localhost` directement. Vous devrez :
- Soit utiliser un tunnel (ngrok, localtunnel)
- Soit tester avec un backend déployé

## 🔧 Solution temporaire : Mode développement

Si vous voulez tester le plugin sans backend, vous pouvez temporairement activer un mode "mock" :

1. Le plugin peut fonctionner sans token (mais avec des données mockées)
2. Ou créer un token de test directement dans le code (non recommandé pour la production)

## 📝 Structure d'un API token

Un API token ressemble généralement à :
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

C'est un **JWT (JSON Web Token)** qui contient :
- L'ID de l'utilisateur
- La date d'expiration
- D'autres informations cryptées

## 🛡️ Sécurité

⚠️ **Important** :
- Ne partagez **jamais** votre API token
- Ne le commitez **jamais** dans Git
- Si vous pensez qu'il a été compromis, régénérez-le immédiatement
- Le token est sauvegardé localement dans Figma (`figma.clientStorage`)

## 🚀 Prochaines étapes

1. **Si vous avez un backend déployé** :
   - Suivez l'Option 1 ci-dessus

2. **Si vous développez en local** :
   - Suivez l'Option 2 ci-dessus
   - Ou utilisez un tunnel pour exposer votre backend local

3. **Si vous n'avez pas encore de backend** :
   - Déployez d'abord votre backend
   - Puis suivez l'Option 1

## ❓ Questions fréquentes

**Q : Le token expire-t-il ?**
R : Oui, généralement après 7 jours (configurable dans le backend). Vous devrez vous reconnecter.

**Q : Puis-je avoir plusieurs tokens ?**
R : Oui, vous pouvez créer plusieurs tokens pour différents usages (développement, production, etc.)

**Q : Comment révoquer un token ?**
R : Via le dashboard, dans la section "API Keys", vous pouvez supprimer un token.

**Q : Le plugin fonctionne-t-il sans token ?**
R : Non, pour la génération réelle. Le plugin nécessite un token valide pour communiquer avec l'API.
