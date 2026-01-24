# Solution : Erreur de syntaxe dans la console Figma

## Problème identifié

L'erreur "Syntax error on line 2: Unexpected token" dans la console Figma est causée par :

1. **Balise script en double** dans `ui.html` avec un chemin absolu incorrect (`/ui.js`)
2. **Format du bundle** qui peut causer des problèmes de parsing

## Corrections appliquées

✅ **Fichier `src/ui/index.html` corrigé** :
- Suppression de la balise script avec chemin absolu `/ui.js`
- Conservation uniquement de `<script src="ui.js"></script>` (chemin relatif)

✅ **Configuration Vite améliorée** :
- Ajout de `minify: 'esbuild'` pour une meilleure compatibilité
- Configuration optimisée pour le format IIFE

## Étapes pour résoudre

1. **Rebuild complet** :
   ```bash
   cd figma-plugin
   npm run build
   ```

2. **Vérifier les fichiers générés** :
   ```bash
   ls -lh manifest.json code.js ui.html ui.js
   ```

3. **Vérifier le contenu de ui.html** :
   ```bash
   cat ui.html
   ```
   
   Doit contenir uniquement :
   ```html
   <script src="ui.js"></script>
   ```
   
   **PAS** de :
   - `<script src="/ui.js"></script>` (chemin absolu)
   - Balises script en double

4. **Recharger le plugin dans Figma** :
   - Fermez le plugin
   - **Plugins** → **Development** → **Import plugin from manifest...**
   - Sélectionnez `manifest.json`
   - Relancez le plugin

## Si l'erreur persiste

1. **Ouvrez la console Figma** :
   - Cliquez sur "Show/Hide console" dans le message d'erreur
   - Copiez le message d'erreur complet

2. **Vérifiez la taille des fichiers** :
   - `code.js` : ~9-10 KB
   - `ui.js` : ~150 KB
   - `ui.html` : ~550 bytes

3. **Vérifiez que ui.js commence correctement** :
   ```bash
   head -1 ui.js
   ```
   
   Doit commencer par : `(function(){"use strict";...`

4. **Testez dans un fichier Figma vide** pour éliminer les conflits

## Notes importantes

- Les plugins Figma nécessitent des **chemins relatifs** pour les scripts
- Le chemin `/ui.js` (absolu) ne fonctionne pas dans le contexte du plugin
- Le bundle doit être en format IIFE (Immediately Invoked Function Expression)
- Ne modifiez jamais directement `ui.html` - modifiez `src/ui/index.html` et rebuild
