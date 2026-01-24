# Solution : "Manifest must be named 'manifest.json'"

## 🎯 Problème identifié

L'erreur `Manifest must be named 'manifest.json'` signifie que **Figma exige que le fichier manifest s'appelle exactement `manifest.json`**.

Vous ne pouvez **PAS** utiliser :
- ❌ `manifest-simple.json`
- ❌ `manifest-ultra-simple.json`
- ❌ `manifest-minimal.json`
- ❌ Tout autre nom

**Seul `manifest.json` fonctionne !**

## ✅ Solution

Utilisez **uniquement `manifest.json`** pour charger le plugin dans Figma.

### Pour tester différentes versions :

Au lieu de créer plusieurs manifests, modifiez directement les fichiers référencés :

1. **Pour tester la version simple** :
   - Remplacez temporairement `code.js` par `code-simple.js`
   - Modifiez `manifest.json` : `"main": "code-simple.js"`
   - Rechargez le plugin

2. **Pour revenir à la version complète** :
   - Remplacez `code.js` par le build complet
   - Modifiez `manifest.json` : `"main": "code.js"`
   - Rechargez le plugin

## 📋 Vérifications

Le `manifest.json` principal doit pointer vers :
- `main`: `code.js` (fichier bundlé)
- `ui`: `ui.html` (fichier HTML)

Vérifiez que ces fichiers existent :
```bash
cd /Users/quentin/Documents/Mascot/figma-plugin
ls -la manifest.json code.js ui.html ui.js
```

## 🔧 Actions immédiates

1. **Utilisez `manifest.json`** (pas les autres)
2. **Vérifiez que `code.js` est bundlé correctement** :
   ```bash
   npm run build
   ```
3. **Rechargez le plugin** dans Figma avec `manifest.json`

## 💡 Note importante

Les autres manifests (`manifest-simple.json`, etc.) sont utiles pour le développement, mais pour les charger dans Figma, vous devez :
- Soit les renommer en `manifest.json` (et renommer l'ancien)
- Soit modifier le `manifest.json` principal pour pointer vers les fichiers de test
