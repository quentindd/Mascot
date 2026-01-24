# 🚀 Guide de configuration du backend local

## Étape 1 : Démarrer Docker

**Important** : Docker doit être en cours d'exécution sur votre Mac.

1. Ouvrez **Docker Desktop** (cherchez "Docker" dans Spotlight)
2. Attendez que Docker soit complètement démarré (icône Docker dans la barre de menu)
3. Vérifiez que Docker fonctionne :
   ```bash
   docker ps
   ```

Si vous voyez une erreur, attendez quelques secondes que Docker démarre complètement.

---

## Étape 2 : Démarrer PostgreSQL et Redis

Une fois Docker démarré, exécutez :

```bash
cd backend
docker-compose up -d
```

Cela va :
- ✅ Démarrer PostgreSQL sur le port 5432
- ✅ Démarrer Redis sur le port 6379
- ✅ Créer la base de données `mascot`

**Vérifier que ça fonctionne** :
```bash
docker-compose ps
```

Vous devriez voir `postgres` et `redis` avec le statut "Up".

---

## Étape 3 : Installer les dépendances

```bash
cd backend
npm install
```

---

## Étape 4 : Démarrer le backend

```bash
npm run start:dev
```

Le backend devrait démarrer sur `http://localhost:3000`

**Vérifier** : Ouvrez `http://localhost:3000/api/v1/health` dans votre navigateur.
Vous devriez voir : `{"status":"ok","service":"Mascot API",...}`

---

## Étape 5 : Installer et configurer ngrok

### 5.1 Installer ngrok

1. Téléchargez ngrok : https://ngrok.com/download
2. Décompressez le fichier
3. Déplacez `ngrok` dans `/usr/local/bin/` :
   ```bash
   sudo mv ~/Downloads/ngrok /usr/local/bin/
   sudo chmod +x /usr/local/bin/ngrok
   ```

### 5.2 Créer un tunnel

Dans un **nouveau terminal** (gardez le backend en cours d'exécution) :

```bash
ngrok http 3000
```

Vous obtiendrez une URL comme :
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copiez cette URL** (par exemple : `https://abc123.ngrok.io`)

⚠️ **Important** : Gardez ce terminal ouvert ! Si vous le fermez, le tunnel s'arrête.

---

## Étape 6 : Mettre à jour le plugin

### 6.1 Mettre à jour l'URL de l'API

**Fichier** : `figma-plugin/src/api/client.ts`

Remplacez :
```typescript
const API_BASE_URL = 'https://api.mascot.com/api/v1';
```

Par :
```typescript
const API_BASE_URL = 'https://abc123.ngrok.io/api/v1';  // ← Votre URL ngrok
```

### 6.2 Mettre à jour le manifest

**Fichier** : `figma-plugin/manifest.json`

Ajoutez votre URL ngrok dans `allowedDomains` :
```json
"networkAccess": {
  "allowedDomains": [
    "https://abc123.ngrok.io"  // ← Votre URL ngrok
  ]
}
```

### 6.3 Rebuilder le plugin

```bash
cd figma-plugin
npm run build
```

---

## Étape 7 : Créer un compte et obtenir un token

Dans un terminal, exécutez :

```bash
curl -X POST https://abc123.ngrok.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Réponse attendue** :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    ...
  }
}
```

**Copiez le `accessToken`** - c'est votre API token !

---

## Étape 8 : Utiliser le token dans le plugin

1. Ouvrez Figma
2. Allez dans **Plugins** → **Development** → **Mascot**
3. Cliquez sur **"Sign In with API Token"**
4. Collez le `accessToken` que vous avez copié
5. Cliquez sur OK

✅ Vous êtes maintenant connecté !

---

## 🎉 Test final

1. Allez dans l'onglet **"Character"**
2. Remplissez le formulaire :
   - **Name** : Test Mascot
   - **Prompt** : A cute robot mascot
   - **Style** : kawaii
3. Cliquez sur **"Generate Mascot"**

Le plugin devrait maintenant communiquer avec votre backend local ! 🚀

---

## ⚠️ Notes importantes

- **ngrok URL change** : Si vous redémarrez ngrok, l'URL change. Vous devrez mettre à jour le plugin.
- **Docker doit rester actif** : Gardez Docker Desktop ouvert pendant le développement.
- **Backend doit rester actif** : Gardez `npm run start:dev` en cours d'exécution.
- **ngrok doit rester actif** : Gardez le terminal ngrok ouvert.

---

## 🐛 Dépannage

### Docker ne démarre pas
- Vérifiez que Docker Desktop est bien lancé
- Redémarrez Docker Desktop si nécessaire

### Le backend ne démarre pas
- Vérifiez que PostgreSQL et Redis sont bien démarrés : `docker-compose ps`
- Vérifiez les logs : `docker-compose logs postgres`

### ngrok ne fonctionne pas
- Vérifiez que le backend est bien démarré sur le port 3000
- Testez : `curl http://localhost:3000/api/v1/health`

### Le plugin ne peut pas se connecter
- Vérifiez que l'URL ngrok est correcte dans `figma-plugin/src/api/client.ts`
- Vérifiez que l'URL est dans `manifest.json` → `allowedDomains`
- Rebuildez le plugin : `cd figma-plugin && npm run build`
- Rechargez le plugin dans Figma
