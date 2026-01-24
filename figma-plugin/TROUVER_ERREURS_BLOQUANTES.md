# Comment trouver les erreurs qui bloquent vraiment

## 🔍 Méthode 1 : Filtrer dans la console

Dans la console Figma, utilisez le filtre pour voir seulement les erreurs importantes :

1. **Ouvrez la console** : Plugins → Development → Show/Hide console
2. **Cliquez sur le filtre** (icône en forme d'entonnoir)
3. **Cochez seulement** :
   - ✅ Errors (erreurs)
   - ✅ Warnings (avertissements)
   - ❌ Décochez Info et Logs

4. **Cherchez les erreurs qui commencent par** :
   - `Error:` (pas `[Violation]`)
   - `Uncaught Error`
   - `Uncaught TypeError`
   - `Failed to load`
   - `Cannot find`
   - `ReferenceError`

## 🔍 Méthode 2 : Chercher les erreurs de votre plugin

Dans la console, cherchez les messages qui contiennent :
- `MascotForge` (nom de votre plugin)
- `ui.js` (votre fichier)
- `code.js` (votre fichier)

Ces erreurs sont les vôtres, pas celles de Figma.

## 🔍 Méthode 3 : Vérifier le panneau d'erreur

Quand le plugin s'ouvre, regardez :
1. **Le message d'erreur rouge** en haut du panneau
2. **Le texte exact** de ce message
3. **Copiez ce message** (c'est l'erreur importante)

## 🔍 Méthode 4 : Activer le mode debug

J'ai ajouté des logs de debug dans le code. Après rebuild, vous devriez voir dans la console :

```
[MascotForge] Initializing plugin...
[MascotForge] UI shown successfully
[MascotForge] Plugin initialized
```

Si vous ne voyez pas ces messages, ou si vous voyez `[MascotForge Error...]`, c'est là que se trouve le problème.

## 📋 Checklist pour identifier l'erreur

1. **Quel est le message d'erreur exact** dans le panneau rouge ?
   - Copiez-le mot pour mot

2. **Dans la console, filtrez par "Errors"** :
   - Quelles erreurs apparaissent ?
   - Y a-t-il des erreurs avec `MascotForge` dans le nom ?

3. **Le panneau s'ouvre-t-il du tout ?**
   - [ ] Oui, mais il est vide
   - [ ] Oui, mais il affiche une erreur
   - [ ] Non, rien ne s'ouvre

4. **Voyez-vous les messages de debug** ?
   - `[MascotForge] Initializing plugin...`
   - Si non, le code ne s'exécute pas du tout

## 🎯 Erreurs courantes et où les trouver

### "Failed to load resource: ui.js"
- **Où** : Console, onglet Network ou Console
- **Cause** : ui.js n'est pas trouvé ou mal chargé

### "Uncaught ReferenceError: React is not defined"
- **Où** : Console, filtre Errors
- **Cause** : Problème avec le bundle React

### "Cannot read property 'X' of undefined"
- **Où** : Console, filtre Errors
- **Cause** : Erreur dans votre code JavaScript

### "Error: Unable to load code"
- **Où** : Message d'erreur rouge dans Figma
- **Cause** : code.js ne peut pas être chargé

## 🛠️ Actions immédiates

1. **Rebuild avec les nouveaux logs** :
   ```bash
   cd /Users/quentin/Documents/Mascot/figma-plugin
   npm run build
   ```

2. **Rechargez le plugin dans Figma**

3. **Ouvrez la console et cherchez** :
   - Messages commençant par `[MascotForge]`
   - Erreurs avec `MascotForge` dans le nom
   - Le message d'erreur exact du panneau rouge

4. **Partagez ces informations** :
   - Le message d'erreur du panneau rouge (exact)
   - Les messages `[MascotForge]` de la console
   - Toute erreur qui mentionne `MascotForge`, `ui.js`, ou `code.js`
