# Installation de FFmpeg sur macOS

## Méthode 1 : Homebrew (Recommandé)

### Étape 1 : Installer Homebrew (si pas déjà installé)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Note :** Si vous avez une erreur de connexion, vérifiez votre connexion internet ou utilisez une autre méthode.

### Étape 2 : Installer FFmpeg

```bash
brew install ffmpeg
```

### Étape 3 : Vérifier l'installation

```bash
ffmpeg -version
```

Vous devriez voir la version de FFmpeg affichée.

---

## Méthode 2 : Téléchargement direct (Alternative)

Si Homebrew ne fonctionne pas, vous pouvez télécharger FFmpeg directement :

1. **Aller sur** : https://evermeet.cx/ffmpeg/
2. **Télécharger** : `ffmpeg-x.x.x.zip` (version la plus récente)
3. **Extraire** le fichier ZIP
4. **Déplacer** `ffmpeg` dans `/usr/local/bin/` :

```bash
sudo mv ~/Downloads/ffmpeg /usr/local/bin/
sudo chmod +x /usr/local/bin/ffmpeg
```

5. **Vérifier** :

```bash
ffmpeg -version
```

---

## Méthode 3 : MacPorts (Alternative)

Si vous avez MacPorts installé :

```bash
sudo port install ffmpeg
```

---

## Vérification après installation

Une fois installé, vérifiez que FFmpeg fonctionne :

```bash
# Vérifier la version
ffmpeg -version

# Tester une conversion simple
ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 test.mp4
```

Si vous voyez la version et que la commande de test fonctionne, FFmpeg est correctement installé !

---

## Pour Railway (Production)

Si vous déployez sur Railway, vous devrez ajouter FFmpeg dans votre Dockerfile :

```dockerfile
# Dans votre Dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

Ou utiliser un buildpack qui inclut FFmpeg.

---

## Problèmes courants

### Erreur : "command not found: ffmpeg"
- Vérifiez que FFmpeg est dans votre PATH
- Ajoutez `/usr/local/bin` à votre PATH si nécessaire

### Erreur : "Permission denied"
- Utilisez `sudo` pour les installations système
- Ou installez dans votre répertoire utilisateur

### Erreur : "Homebrew not found"
- Installez Homebrew d'abord (voir Méthode 1)
- Ou utilisez une autre méthode d'installation
