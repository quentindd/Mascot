# Workflow de développement - Plugin Figma

## 🔄 Quand recharger le plugin ?

### ✅ **Juste actualiser** (Refresh) suffit pour :
- Modifications du code TypeScript/JavaScript (`src/code.ts`, `src/ui/*.tsx`)
- Modifications CSS (`src/ui/App.css`)
- Modifications de l'UI React
- **Après avoir fait `npm run build`**

**Comment actualiser :**
1. Dans Figma, ouvrez la console (View → Toggle Developer Console)
2. Fermez le panneau du plugin (s'il est ouvert)
3. Relancez le plugin (Plugins → Development → Mascot)
4. OU : Utilisez `Cmd+R` dans le panneau du plugin (si supporté)

### ❌ **Reupload du manifest** nécessaire pour :
- Modifications de `manifest.json` :
  - Nom du plugin
  - ID du plugin
  - Permissions
  - Network access domains
  - API version
- Changement de structure de fichiers (nouveaux fichiers `code.js` ou `ui.html`)

**Comment reuploader :**
1. Fermez complètement Figma Desktop (Quit)
2. Rouvrez Figma
3. Plugins → Development → Import plugin from manifest...
4. Sélectionnez `manifest.json`
5. Le plugin apparaît dans la liste

## 📝 Workflow recommandé

### Développement quotidien :
```bash
# 1. Modifiez le code
# 2. Rebuild
npm run build

# 3. Dans Figma : Fermez et relancez le plugin
# (Pas besoin de reuploader le manifest)
```

### Changement de configuration :
```bash
# 1. Modifiez manifest.json
# 2. Rebuild
npm run build

# 3. Dans Figma : Reupload le manifest
```

## 🐛 Debugging

### Si l'UI est blanche :
1. Ouvrez la console (View → Toggle Developer Console)
2. Cherchez les messages `[Mascot]`
3. Vérifiez les erreurs JavaScript

### Si le plugin ne se charge pas :
1. Vérifiez que `code.js` et `ui.html` existent dans le dossier
2. Vérifiez que `manifest.json` pointe vers les bons fichiers
3. Reupload le manifest

## ⚡ Astuce

Pour un développement rapide, utilisez le watch mode :
```bash
npm run watch
```

Puis dans Figma, fermez et relancez le plugin après chaque modification.
