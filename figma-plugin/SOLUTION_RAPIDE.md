# Solution rapide - Si vous avez encore des erreurs

## 🎯 Testez d'abord la version minimale

J'ai créé une version minimale du plugin pour isoler le problème :

1. **Compilez la version de test** :
   ```bash
   cd /Users/quentin/Documents/Mascot/figma-plugin
   npx tsc test-minimal-code.ts --outDir . --target ES2020 --module commonjs --lib ES2020 --types @figma/plugin-typings
   ```

2. **Chargez `test-minimal-manifest.json` dans Figma**

3. **Si ça fonctionne** → Le problème vient du code React complexe
4. **Si ça ne fonctionne pas** → Le problème vient de la configuration Figma

## 🔧 Actions immédiates

### 1. Partagez les erreurs exactes

**Copiez les 5-10 premières lignes d'erreur** de la console Figma (pas toutes, juste le début).

Les erreurs importantes commencent généralement par :
- `Error: Unable to load code`
- `Error: ENOENT`
- `Error: Unknown plugin`
- `Uncaught Error` ou `Uncaught TypeError`

### 2. Vérifiez rapidement

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Vérifier que tous les fichiers existent
ls -la manifest.json code.js ui.html ui.js

# Vérifier la syntaxe
node -c code.js

# Vérifier ui.html
head -5 ui.html
```

### 3. Rebuild propre

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Nettoyer
rm -f code.js ui.js ui.html

# Rebuild
npm run build

# Vérifier
ls -lh manifest.json code.js ui.html ui.js
```

### 4. Nettoyer Figma

1. **Fermez complètement Figma Desktop**
2. Supprimez le cache :
   ```bash
   rm -rf ~/Library/Application\ Support/Figma/Plugins/*
   ```
3. **Rouvrez Figma**
4. Rechargez le plugin

## 📋 Informations à partager

Si vous partagez les erreurs, incluez :

1. **Les 5-10 premières lignes d'erreur** de la console
2. **Résultat de** :
   ```bash
   ls -la manifest.json code.js ui.html ui.js
   ```
3. **À quelle étape ça échoue** :
   - [ ] Chargement du manifest
   - [ ] Ouverture du plugin
   - [ ] Affichage de l'UI
   - [ ] Autre (précisez)

## 🆘 Alternative : Plugin simple sans React

Si React cause des problèmes, je peux créer une version sans React (juste HTML/JavaScript vanilla). Dites-moi si vous voulez que je fasse ça.
