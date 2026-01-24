# Diagnostic : Interface blanche

## 🔍 Vérifications à faire

### 1. Ouvrez la console Figma
- View → Toggle Developer Console (ou `Cmd+Option+I` sur Mac)
- Regardez les messages qui commencent par `[Mascot]`

### 2. Messages attendus

Si tout fonctionne, vous devriez voir :
```
[Mascot] Initializing plugin...
[Mascot] UI shown successfully
[Mascot] Plugin initialized
[Mascot] Mounting React app...
[Mascot] React app mounted successfully
[Mascot] App component mounted
```

### 3. Si vous ne voyez PAS ces messages

**A. Aucun message `[Mascot]` :**
- Le plugin ne se charge pas du tout
- Vérifiez que `code.js` existe et est à jour
- Rebuild : `npm run build`
- Reupload le manifest

**B. Vous voyez `[Mascot] Initializing plugin...` mais pas `[Mascot] UI shown successfully` :**
- Problème de chargement de `ui.html`
- Vérifiez que `ui.html` existe dans le dossier
- Vérifiez que `manifest.json` pointe vers `"ui": "ui.html"`

**C. Vous voyez `[Mascot] UI shown successfully` mais pas `[Mascot] Mounting React app...` :**
- Le script `ui.js` ne se charge pas
- Vérifiez que `ui.js` existe (doit faire ~150KB)
- Vérifiez que `ui.html` contient `<script src="ui.js"></script>`
- Rebuild : `npm run build:ui`

**D. Vous voyez `[Mascot] Mounting React app...` mais pas `[Mascot] React app mounted successfully` :**
- Erreur lors du montage React
- Regardez les erreurs dans la console
- Vérifiez que `<div id="root"></div>` existe dans `ui.html`

**E. Vous voyez tout mais l'UI est toujours blanche :**
- Erreur dans le composant React
- Regardez les erreurs dans la console
- Vérifiez que `App.css` est bien importé

## 🛠️ Solutions

### Solution 1 : Rebuild complet
```bash
cd figma-plugin
rm -f code.js ui.js ui.html
npm run build
```

Puis dans Figma :
1. Fermez complètement Figma (Quit)
2. Rouvrez Figma
3. Reupload le manifest

### Solution 2 : Vérifier les fichiers
```bash
cd figma-plugin
ls -lh code.js ui.js ui.html
```

Tous doivent exister et avoir une taille raisonnable :
- `code.js` : ~11KB
- `ui.js` : ~150KB
- `ui.html` : ~1KB

### Solution 3 : Vérifier le manifest
Ouvrez `manifest.json` et vérifiez :
```json
{
  "main": "code.js",
  "ui": "ui.html"
}
```

## 📋 Checklist

- [ ] Console ouverte (View → Toggle Developer Console)
- [ ] Messages `[Mascot]` visibles
- [ ] `code.js` existe et est récent
- [ ] `ui.js` existe et fait ~150KB
- [ ] `ui.html` existe et contient `<script src="ui.js"></script>`
- [ ] `manifest.json` pointe vers les bons fichiers
- [ ] Rebuild effectué après modifications
- [ ] Plugin rechargé dans Figma

## 🐛 Erreurs courantes

### "Cannot read property 'root' of null"
- Le script s'exécute avant que le DOM soit prêt
- Solution : Les logs de diagnostic devraient aider

### "Uncaught SyntaxError"
- Erreur de syntaxe dans le code compilé
- Solution : Vérifiez le code source, rebuild

### "Failed to load resource: ui.js"
- Le fichier n'existe pas ou le chemin est incorrect
- Solution : Vérifiez que `ui.js` est dans le même dossier que `manifest.json`
