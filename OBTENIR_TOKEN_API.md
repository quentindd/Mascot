# 🔑 Comment obtenir un token API

## Option 1 : Se connecter (si vous avez déjà un compte)

### Via curl (Terminal)

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

**Réponse :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": { ... }
}
```

**Le `accessToken` est votre token API !**

### Via Swagger (Interface web)

1. Allez sur : https://mascot-production.up.railway.app/api/docs
2. Trouvez l'endpoint `POST /api/v1/auth/login`
3. Cliquez sur "Try it out"
4. Entrez votre email et mot de passe
5. Cliquez sur "Execute"
6. Copiez le `accessToken` de la réponse

---

## Option 2 : Créer un nouveau compte

### Via curl (Terminal)

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau-email@example.com",
    "password": "votre-mot-de-passe",
    "name": "Votre Nom"
  }'
```

**Réponse :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "nouveau-email@example.com",
    "name": "Votre Nom",
    "plan": "free",
    "creditBalance": 100
  }
}
```

**Le `accessToken` est votre token API !**

### Via Swagger (Interface web)

1. Allez sur : https://mascot-production.up.railway.app/api/docs
2. Trouvez l'endpoint `POST /api/v1/auth/register`
3. Cliquez sur "Try it out"
4. Entrez :
   - **email** : votre email
   - **password** : votre mot de passe
   - **name** : votre nom (optionnel)
5. Cliquez sur "Execute"
6. Copiez le `accessToken` de la réponse

---

## Option 3 : Utiliser le plugin Figma directement

1. Ouvrez le plugin Figma
2. Cliquez sur **"Sign In with API Token"**
3. Si vous avez déjà un compte :
   - Utilisez l'**Option 1** ci-dessus pour obtenir un token
   - Collez le token dans le plugin
4. Si vous n'avez pas de compte :
   - Utilisez l'**Option 2** ci-dessus pour créer un compte
   - Collez le token dans le plugin

---

## 📝 Notes importantes

- Le token expire après 7 jours (par défaut)
- Si le token expire, utilisez l'**Option 1** pour obtenir un nouveau token
- Le token commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Gardez votre token secret, ne le partagez jamais publiquement

---

## 🔗 Liens utiles

- **API Swagger** : https://mascot-production.up.railway.app/api/docs
- **Endpoint Login** : `POST /api/v1/auth/login`
- **Endpoint Register** : `POST /api/v1/auth/register`
