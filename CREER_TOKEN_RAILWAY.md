# Créer un Token API depuis Railway

## 🎯 Méthode rapide

Votre backend est déployé sur Railway : `https://mascot-production.up.railway.app`

## 📋 Étape 1 : Créer un compte

Exécutez cette commande dans le Terminal :

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "VotreMotDePasse123!",
    "name": "Votre Nom"
  }'
```

**Réponse attendue :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "votre-email@example.com",
    "plan": "free",
    "creditBalance": 1
  }
}
```

**Copiez le `accessToken`** - c'est votre token API !

---

## 📋 Étape 2 : Utiliser le token

### Dans le plugin Figma :

1. Ouvrez Figma
2. Chargez le plugin Mascot
3. Cliquez sur **"Sign In with API Token"**
4. Collez le `accessToken` que vous avez copié

### Pour tester via curl :

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/mascots \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Gemini",
    "mascotDetails": "Bird with a bag",
    "style": "3d",
    "type": "animal",
    "personality": "friendly",
    "color": "purple",
    "numVariations": 1
  }'
```

---

## 🔄 Si vous avez déjà un compte

Si vous avez déjà créé un compte, connectez-vous :

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "VotreMotDePasse123!"
  }'
```

Vous recevrez aussi un `accessToken` dans la réponse.

---

## 💡 Astuce

Si vous voulez plusieurs comptes de test, créez-en plusieurs avec des emails différents. Chaque compte commence avec 1 crédit gratuit.

---

**Une fois que vous avez le token, testez la génération avec Gemini ! 🚀**
