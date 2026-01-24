# 🚀 Configuration automatique - Étapes simples

## ✅ Script automatique créé !

J'ai créé un script qui fait tout automatiquement. Voici comment l'utiliser :

---

## 📋 Étapes (très simples)

### 1️⃣ Démarrer Docker Desktop

**Ouvrez Docker Desktop** depuis Applications sur votre Mac.

Attendez que l'icône Docker dans la barre de menu soit verte (Docker est prêt).

---

### 2️⃣ Lancer le script automatique

Dans un terminal, exécutez :

```bash
cd /Users/quentin/Documents/Mascot/backend
./setup-and-start.sh
```

Le script va :
- ✅ Vérifier que Docker est démarré
- ✅ Installer les dépendances npm (si nécessaire)
- ✅ Démarrer PostgreSQL et Redis avec Docker
- ✅ Démarrer le backend

**⏱️ Temps estimé : 2-3 minutes**

---

### 3️⃣ Vérifier que le backend fonctionne

Une fois le backend démarré, ouvrez dans votre navigateur :

```
http://localhost:3000/api/v1/health
```

Vous devriez voir :
```json
{"status":"ok","service":"Mascot API",...}
```

✅ **Le backend fonctionne !**

---

### 4️⃣ Installer ngrok (si pas déjà fait)

```bash
# Télécharger ngrok
curl -o /tmp/ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip

# Décompresser
unzip /tmp/ngrok.zip -d /tmp/

# Installer
sudo mv /tmp/ngrok /usr/local/bin/
sudo chmod +x /usr/local/bin/ngrok
```

---

### 5️⃣ Créer un tunnel ngrok

**Dans un NOUVEAU terminal** (gardez le backend en cours d'exécution) :

```bash
ngrok http 3000
```

**Copiez l'URL** qui apparaît, par exemple :
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**⚠️ Gardez ce terminal ouvert !**

---

### 6️⃣ Mettre à jour le plugin

Je vais le faire pour vous une fois que vous avez l'URL ngrok. Dites-moi l'URL et je mettrai à jour les fichiers automatiquement.

---

### 7️⃣ Créer un compte et obtenir un token

Une fois le plugin mis à jour, je vous donnerai la commande curl pour créer un compte.

---

## 🎯 Résumé

1. **Démarrer Docker Desktop** (manuellement)
2. **Lancer** `./setup-and-start.sh` (automatique)
3. **Installer ngrok** (une seule fois)
4. **Créer un tunnel** `ngrok http 3000` (chaque session)
5. **Me donner l'URL ngrok** → Je mets à jour le plugin
6. **Créer un compte** → Je vous donne la commande

---

## ❓ Questions

**Q : Le script ne démarre pas ?**
→ Vérifiez que Docker Desktop est bien démarré et que l'icône est verte.

**Q : Erreur "port already in use" ?**
→ Un autre processus utilise le port 3000. Arrêtez-le ou changez le port dans `.env`.

**Q : PostgreSQL ne démarre pas ?**
→ Vérifiez les logs : `docker-compose logs postgres`

---

## 🚀 Commencez maintenant !

1. **Démarrez Docker Desktop**
2. **Exécutez** : `cd backend && ./setup-and-start.sh`
3. **Dites-moi quand c'est fait** et je continue avec ngrok !
