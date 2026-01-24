# Solution : Problème des imports ES6

## 🎯 Problème identifié

Le fichier `code.js` contenait des imports ES6 (`import { MascotForgeAPI } from './api/client';`) que Figma ne peut pas résoudre car les modules ne sont pas bundlés ensemble.

**Erreur résultante** : "An error occurred while running this plugin"

## ✅ Solution appliquée

J'ai configuré **esbuild** pour bundler le code du plugin en un seul fichier :

1. **Ajout de esbuild** dans les devDependencies
2. **Nouveau script `build:code`** qui bundle tout le code
3. **Modification du script `build`** pour utiliser le bundler

## 🔧 Changements

### Avant (problématique) :
```javascript
// code.js contenait :
import { MascotForgeAPI } from './api/client';
import { RPC } from './rpc/rpc';
// ❌ Figma ne peut pas résoudre ces imports
```

### Après (corrigé) :
```javascript
// code.js est maintenant un bundle complet :
var MascotForgeAPI = class { ... };
var RPC = class { ... };
// ✅ Tout est dans un seul fichier
```

## 📋 Build maintenant

Le build fonctionne correctement :

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin
npm run build
```

Cela va :
1. Bundler `code.ts` et toutes ses dépendances → `code.js`
2. Bundler l'UI React → `ui.js`
3. Copier `ui.html`

## ✅ Prochaines étapes

1. **Rebuild effectué** - Le code est maintenant bundlé
2. **Rechargez le plugin dans Figma** :
   - Supprimez le plugin de la liste
   - Rechargez avec "Import plugin from manifest..."
   - Sélectionnez `manifest.json`

3. **Le plugin devrait maintenant fonctionner !**

## 🔍 Vérification

Vérifiez que `code.js` ne contient plus d'imports :

```bash
grep -E "^import|^export" code.js
```

Si rien n'apparaît, c'est bon ! Le code est bundlé.

## 📝 Note technique

- **esbuild** bundle tout le code TypeScript en un seul fichier JavaScript
- Les imports sont résolus et inlinés dans le bundle
- Le format `iife` (Immediately Invoked Function Expression) est utilisé pour l'isolation
- `--external:figma` indique à esbuild de ne pas bundler l'API Figma (elle est globale)
