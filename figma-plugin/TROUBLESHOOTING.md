# Troubleshooting - Erreurs courantes

## Erreur lors de l'upload du manifest.json dans Figma

### Vérifications à faire :

1. **Tous les fichiers requis existent :**
   ```bash
   ls -la manifest.json code.js ui.html ui.js
   ```
   Tous ces fichiers doivent être présents dans le dossier `figma-plugin/`

2. **Le manifest.json est valide :**
   - Vérifiez qu'il n'y a pas d'erreurs de syntaxe JSON
   - Les chemins `main` et `ui` doivent pointer vers les fichiers générés

3. **Les fichiers sont dans le même dossier que manifest.json :**
   - `manifest.json` doit être dans le même dossier que `code.js`, `ui.html`, et `ui.js`
   - Ne pas mettre `manifest.json` dans un sous-dossier

4. **Rebuild si nécessaire :**
   ```bash
   npm run build
   ```

### Erreurs spécifiques :

#### "Cannot find code.js"
- Vérifiez que `code.js` existe dans le même dossier que `manifest.json`
- Relancez `npm run build`

#### "Cannot find ui.html"
- Vérifiez que `ui.html` existe
- Le script de build devrait le créer automatiquement
- Si manquant, relancez `npm run build`

#### "Plugin failed to load"
- Ouvrez la console Figma : **Plugins** → **Development** → **Show/Hide Console**
- Vérifiez les erreurs JavaScript
- Vérifiez que `ui.js` contient du code (pas vide)

### Solution rapide :

```bash
cd figma-plugin
npm run build
# Vérifiez que tous les fichiers existent
ls -la manifest.json code.js ui.html ui.js
# Puis rechargez le plugin dans Figma
```
