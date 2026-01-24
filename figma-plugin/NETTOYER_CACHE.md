# Comment nettoyer le cache Figma

## 📍 Où exécuter la commande

### Option 1 : Terminal (recommandé)

1. **Ouvrez le Terminal** sur macOS :
   - Appuyez sur `Cmd + Espace` (Spotlight)
   - Tapez "Terminal"
   - Appuyez sur Entrée
   - OU allez dans : **Applications** → **Utilitaires** → **Terminal**

2. **Copiez-collez cette commande** :
   ```bash
   rm -rf ~/Library/Application\ Support/Figma/Plugins/*
   ```

3. **Appuyez sur Entrée**

4. **Confirmez** si demandé (généralement pas nécessaire)

### Option 2 : Depuis le dossier du plugin

Si vous êtes déjà dans le terminal et dans le dossier du plugin :

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Nettoyer le cache Figma
rm -rf ~/Library/Application\ Support/Figma/Plugins/*
```

## ⚠️ Important

1. **Fermez Figma Desktop AVANT** d'exécuter la commande
   - Allez dans : **Figma** → **Quit Figma** (ou `Cmd + Q`)
   - Ne fermez pas juste la fenêtre, quittez complètement l'application

2. **Cette commande supprime TOUS les plugins de développement**
   - Vos plugins installés depuis le store ne seront pas affectés
   - Seuls les plugins de développement (ceux que vous testez) seront supprimés

3. **Après avoir nettoyé le cache** :
   - Rouvrez Figma Desktop
   - Rechargez votre plugin avec "Import plugin from manifest..."

## 🔍 Vérifier que ça a fonctionné

Après avoir exécuté la commande, vous pouvez vérifier :

```bash
ls ~/Library/Application\ Support/Figma/Plugins/
```

Si le dossier est vide ou n'existe pas, c'est bon signe !

## 📝 Commande complète étape par étape

Voici la séquence complète :

```bash
# 1. Fermez Figma Desktop d'abord (Cmd + Q)

# 2. Ouvrez le Terminal

# 3. Exécutez cette commande :
rm -rf ~/Library/Application\ Support/Figma/Plugins/*

# 4. (Optionnel) Vérifiez que c'est vide :
ls ~/Library/Application\ Support/Figma/Plugins/

# 5. Rouvrez Figma Desktop

# 6. Rechargez votre plugin
```

## 🆘 Si vous avez une erreur "Permission denied"

Si la commande ne fonctionne pas, essayez avec `sudo` (nécessite votre mot de passe) :

```bash
sudo rm -rf ~/Library/Application\ Support/Figma/Plugins/*
```

Mais normalement, `sudo` ne devrait pas être nécessaire pour votre propre dossier utilisateur.
