# Vérifier le chargement de ui.js

## 🔍 Le problème

Le bundle `ui.js` est correctement généré (151KB) et contient tous les logs, mais vous ne voyez pas les messages `[Mascot]` dans la console. Cela signifie que **`ui.js` ne se charge probablement pas**.

## ✅ Vérifications à faire

### 1. Vérifier l'onglet Network

1. Dans la console Figma, allez dans l'onglet **Network** (ou **Réseau**)
2. Rechargez le plugin (fermez et relancez-le)
3. Cherchez `ui.js` dans la liste
4. Vérifiez :
   - ✅ **Status** : doit être `200` (succès)
   - ❌ Si c'est `404` : le fichier n'est pas trouvé
   - ❌ Si c'est `Failed` : erreur de chargement

### 2. Vérifier le chemin du fichier

Dans l'onglet Network, regardez l'URL de `ui.js` :
- Doit être quelque chose comme : `file:///.../figma-plugin/ui.js`
- Si l'URL est incorrecte, le fichier n'est pas au bon endroit

### 3. Vérifier les erreurs de chargement

Dans la console, cherchez des erreurs comme :
- `Failed to load resource: ui.js`
- `404 (Not Found)`
- `ERR_FILE_NOT_FOUND`

### 4. Vérifier que ui.html charge ui.js

Ouvrez `ui.html` et vérifiez qu'il contient :
```html
<script src="ui.js"></script>
```

## 🛠️ Solutions possibles

### Solution 1 : Vérifier l'emplacement des fichiers

Assurez-vous que tous ces fichiers sont dans le **même dossier** :
- `manifest.json`
- `code.js`
- `ui.html`
- `ui.js`

### Solution 2 : Rebuild et reupload

```bash
cd figma-plugin
npm run build
```

Puis dans Figma :
1. Fermez complètement Figma (Quit)
2. Rouvrez Figma
3. Reupload le manifest

### Solution 3 : Vérifier les permissions

Sur Mac, vérifiez que Figma a les permissions pour accéder au dossier du plugin.

## 📸 Envoyez-moi

1. Une capture d'écran de l'onglet **Network** montrant la requête pour `ui.js`
2. Le statut de la requête (200, 404, Failed, etc.)
3. Toute erreur dans la console liée à `ui.js`
