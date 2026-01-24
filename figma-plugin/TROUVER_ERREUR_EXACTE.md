# Comment trouver l'erreur exacte qui bloque le plugin

## 🎯 Message : "An error occurred while running this plugin"

C'est un message générique. Il faut trouver l'erreur JavaScript exacte.

## 📋 Étapes pour trouver l'erreur

### Étape 1 : Ouvrir la console AVANT de lancer le plugin

1. **Ouvrez Figma Desktop**
2. **Ouvrez la console** : Plugins → Development → **Show/Hide console**
3. **Laissez la console ouverte**
4. **Lancez le plugin** (Plugins → Development → MascotForge)

### Étape 2 : Chercher les erreurs dans la console

Dans la console, cherchez :

1. **Messages avec `[MascotForge]`** :
   - `[MascotForge] Starting plugin...`
   - `[MascotForge] CRITICAL ERROR:` ← **C'est l'erreur importante !**

2. **Erreurs JavaScript** :
   - `Uncaught Error:`
   - `Uncaught TypeError:`
   - `ReferenceError:`
   - `SyntaxError:`

3. **Erreurs de chargement** :
   - `Failed to load resource: code.js`
   - `Failed to load resource: ui.js`

### Étape 3 : Filtrer les erreurs

Dans la console :
1. Cliquez sur le **filtre** (icône entonnoir)
2. Cochez seulement :
   - ✅ **Errors**
   - ✅ **Warnings**
3. Décochez :
   - ❌ Info
   - ❌ Logs

### Étape 4 : Copier l'erreur exacte

**Copiez la première erreur** qui apparaît après avoir lancé le plugin. Elle devrait contenir :
- Le message d'erreur
- Le fichier (code.js ou ui.js)
- La ligne de code

## 🔍 Test avec version simplifiée

J'ai créé une version ultra-simplifiée pour tester :

1. **Compilez la version simple** :
   ```bash
   cd /Users/quentin/Documents/Mascot/figma-plugin
   npx tsc src/code-simple.ts --outDir . --target ES2020 --module commonjs --lib ES2020 --types @figma/plugin-typings
   ```

2. **Chargez `manifest-simple.json`** dans Figma

3. **Si ça fonctionne** → Le problème vient du code complexe (imports, API, etc.)
4. **Si ça ne fonctionne pas** → Le problème vient de la configuration de base

## 📝 Informations à partager

Quand vous trouvez l'erreur, partagez :

1. **Le message d'erreur exact** (copié de la console)
2. **Le fichier mentionné** (code.js, ui.js, etc.)
3. **Les messages `[MascotForge]`** que vous voyez (ou ne voyez pas)

## 🎯 Erreurs courantes

### "Cannot find module" ou "ReferenceError: X is not defined"
- **Cause** : Problème avec les imports
- **Solution** : Vérifier que tous les fichiers sont compilés

### "Failed to load resource: ui.js"
- **Cause** : ui.js n'est pas trouvé
- **Solution** : Vérifier que ui.js existe et est dans le bon dossier

### "Uncaught TypeError: Cannot read property 'X' of undefined"
- **Cause** : Erreur dans le code JavaScript
- **Solution** : Vérifier le code à la ligne mentionnée

### Aucun message `[MascotForge]` dans la console
- **Cause** : Le code ne s'exécute pas du tout
- **Solution** : Vérifier que code.js est bien chargé
