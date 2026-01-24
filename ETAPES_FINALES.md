# 🎯 Étapes finales - Configuration complète

## État actuel

✅ Backend compilé sans erreurs TypeScript
❌ Docker n'est pas démarré (PostgreSQL et Redis non disponibles)

---

## 📋 Checklist complète

### Étape 1 : Démarrer Docker Desktop

**ACTION REQUISE** ⚠️

1. Appuyez sur `Cmd + Espace` (Spotlight)
2. Tapez "Docker"
3. Appuyez sur Entrée pour ouvrir Docker Desktop
4. Attendez 30-60 secondes que Docker démarre complètement
5. Vérifiez que l'icône Docker dans la barre de menu est **verte** (pas grise)

**Comment savoir si Docker est prêt ?**
- Icône Docker en haut à droite = verte
- Ou ouvrez Docker Desktop et vérifiez "Engine running"

---

### Étape 2 : Démarrer PostgreSQL et Redis

Une fois Docker démarré, dans le terminal :

```bash
cd /Users/quentin/Documents/Mascot/backend
docker-compose up -d
```

**Vérifier** :
```bash
docker-compose ps
```

Vous devriez voir :
```
NAME                 STATUS
mascot-postgres      Up
mascot-redis         Up
```

---

### Étape 3 : Vérifier que le backend se connecte

Le backend (déjà en cours d'exécution) devrait automatiquement se reconnecter.

**Test** : Ouvrez dans votre navigateur
```
http://localhost:3000/api/v1/health
```

Vous devriez voir :
```json
{"status":"ok","service":"Mascot API",...}
```

Si ça ne fonctionne pas, arrêtez et relancez :
```bash
# Dans le terminal du backend : Ctrl+C
npm run start:dev
```

---

### Étape 4 : Installer ngrok

```bash
# Télécharger et installer ngrok
brew install ngrok/ngrok/ngrok

# OU manuellement :
curl -o /tmp/ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip
unzip /tmp/ngrok.zip -d /tmp/
sudo mv /tmp/ngrok /usr/local/bin/
sudo chmod +x /usr/local/bin/ngrok
```

**Vérifier** :
```bash
ngrok version
```

---

### Étape 5 : Créer un tunnel ngrok

**Dans un NOUVEAU terminal** :

```bash
ngrok http 3000
```

**Copiez l'URL** qui apparaît, par exemple :
```
Forwarding  https://abc123-456-789.ngrok-free.app -> http://localhost:3000
```

⚠️ **Gardez ce terminal ouvert !**

---

### Étape 6 : Mettre à jour le plugin avec l'URL ngrok

**IMPORTANT** : Donnez-moi votre URL ngrok et je mettrai à jour automatiquement :
1. `figma-plugin/src/api/client.ts`
2. `figma-plugin/manifest.json`
3. Je rebuilderai le plugin

**Format** : `https://abc123-456-789.ngrok-free.app`

---

### Étape 7 : Créer un compte

Une fois le plugin mis à jour, je vous donnerai la commande curl pour créer un compte et obtenir votre API token.

---

## 🚀 Actions immédiates

**MAINTENANT** :
1. Démarrez Docker Desktop (Spotlight → "Docker")
2. Attendez que l'icône soit verte
3. Dites "Docker ok" ici

Ensuite je continuerai avec les étapes suivantes automatiquement.

---

## 🐛 Problèmes courants

### "Cannot connect to the Docker daemon"
→ Docker Desktop n'est pas lancé. Ouvrez-le depuis Applications.

### L'icône Docker reste grise
→ Docker est en train de démarrer. Attendez 1-2 minutes.

### "Port 3000 already in use"
→ Arrêtez le processus : `lsof -ti:3000 | xargs kill -9`

### ngrok change d'URL
→ Normal avec le plan gratuit. Vous devrez mettre à jour le plugin à chaque redémarrage de ngrok.

---

## 📊 Progression

- [x] Backend scaffoldé
- [x] Docker Compose configuré
- [x] Fichier .env créé
- [x] Erreurs TypeScript corrigées
- [ ] **Docker démarré** ← VOUS ÊTES ICI
- [ ] PostgreSQL et Redis lancés
- [ ] Backend connecté
- [ ] ngrok installé
- [ ] Tunnel créé
- [ ] Plugin mis à jour
- [ ] Compte créé
- [ ] Token obtenu
- [ ] Test de génération

**4 étapes restantes après le démarrage de Docker !**
