# 🚀 Démarrage rapide - Backend local

## ✅ Ce qui est déjà fait

- ✅ `docker-compose.yml` créé (PostgreSQL + Redis)
- ✅ Fichier `.env` configuré
- ✅ Script `start.sh` créé

## 📋 Étapes à suivre (dans l'ordre)

### 1️⃣ Démarrer Docker Desktop

**Ouvrez Docker Desktop** sur votre Mac et attendez qu'il soit complètement démarré.

Vérifiez que Docker fonctionne :
```bash
docker ps
```

---

### 2️⃣ Installer les dépendances du backend

```bash
cd backend
npm install
```

⏱️ Cela peut prendre 2-3 minutes.

---

### 3️⃣ Démarrer PostgreSQL et Redis

```bash
cd backend
docker-compose up -d
```

Vérifiez que ça fonctionne :
```bash
docker-compose ps
```

Vous devriez voir `postgres` et `redis` avec le statut "Up".

---

### 4️⃣ Démarrer le backend

```bash
cd backend
npm run start:dev
```

Le backend devrait démarrer sur `http://localhost:3000`

**Testez** : Ouvrez `http://localhost:3000/api/v1/health` dans votre navigateur.

✅ Vous devriez voir : `{"status":"ok","service":"Mascot API",...}`

**⚠️ Gardez ce terminal ouvert !**

---

### 5️⃣ Installer ngrok

1. Téléchargez : https://ngrok.com/download
2. Décompressez et déplacez dans `/usr/local/bin/` :
   ```bash
   sudo mv ~/Downloads/ngrok /usr/local/bin/
   sudo chmod +x /usr/local/bin/ngrok
   ```

---

### 6️⃣ Créer un tunnel ngrok

**Dans un NOUVEAU terminal** (gardez le backend en cours d'exécution) :

```bash
ngrok http 3000
```

Vous obtiendrez une URL comme :
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**📋 Copiez cette URL** (par exemple : `https://abc123.ngrok.io`)

**⚠️ Gardez ce terminal ouvert aussi !**

---

### 7️⃣ Mettre à jour le plugin

#### 7.1 Modifier l'URL de l'API

**Fichier** : `figma-plugin/src/api/client.ts`

Remplacez la ligne 5 :
```typescript
const API_BASE_URL = 'https://api.mascot.com/api/v1';
```

Par (remplacez `abc123.ngrok.io` par votre URL ngrok) :
```typescript
const API_BASE_URL = 'https://abc123.ngrok.io/api/v1';
```

#### 7.2 Modifier le manifest

**Fichier** : `figma-plugin/manifest.json`

Ajoutez votre URL ngrok dans `allowedDomains` :
```json
"networkAccess": {
  "allowedDomains": [
    "https://abc123.ngrok.io"
  ]
}
```

#### 7.3 Rebuilder le plugin

```bash
cd figma-plugin
npm run build
```

---

### 8️⃣ Créer un compte et obtenir un token

Dans un terminal, exécutez (remplacez `abc123.ngrok.io` par votre URL) :

```bash
curl -X POST https://abc123.ngrok.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Réponse** :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  ...
}
```

**📋 Copiez le `accessToken`** - c'est votre API token !

---

### 9️⃣ Utiliser le token dans le plugin

1. Ouvrez **Figma**
2. Allez dans **Plugins** → **Development** → **Mascot**
3. Si nécessaire, reuploadez le `manifest.json` (si vous l'avez modifié)
4. Cliquez sur **"Sign In with API Token"**
5. Collez le `accessToken`
6. Cliquez sur OK

✅ **Vous êtes connecté !**

---

### 🎉 Test final

1. Dans le plugin, allez dans l'onglet **"Character"**
2. Remplissez :
   - **Name** : Test Mascot
   - **Prompt** : A cute robot mascot
   - **Style** : kawaii
3. Cliquez sur **"Generate Mascot"**

Le plugin devrait maintenant communiquer avec votre backend ! 🚀

---

## ⚠️ Important

- **3 terminaux doivent rester ouverts** :
  1. Backend (`npm run start:dev`)
  2. ngrok (`ngrok http 3000`)
  3. Pour les commandes curl/test

- **Si vous redémarrez ngrok**, l'URL change. Vous devrez mettre à jour le plugin.

- **Docker Desktop doit rester actif** pendant le développement.

---

## 🐛 Problèmes courants

### "Cannot connect to Docker daemon"
→ Docker Desktop n'est pas démarré. Démarrez-le.

### "Port 3000 already in use"
→ Un autre processus utilise le port 3000. Arrêtez-le ou changez le port dans `.env`.

### "ngrok: command not found"
→ ngrok n'est pas installé ou pas dans le PATH. Vérifiez l'installation.

### Le plugin ne peut pas se connecter
→ Vérifiez que :
- L'URL ngrok est correcte dans `figma-plugin/src/api/client.ts`
- L'URL est dans `manifest.json` → `allowedDomains`
- Le plugin a été rebundlé (`npm run build`)
- Le plugin a été rechargé dans Figma

---

## 📚 Documentation complète

Voir `SETUP_BACKEND.md` pour plus de détails.
