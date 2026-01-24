# Déboguer les erreurs du plugin Figma

## Erreur : "An error occurred while running this plugin"

### Étape 1 : Voir les détails de l'erreur

1. Dans Figma, cliquez sur **"Show/Hide console"** dans le message d'erreur rouge
2. La console s'ouvre et affiche les détails de l'erreur
3. Copiez le message d'erreur complet

### Étape 2 : Vérifications courantes

#### Vérifier que tous les fichiers existent :
```bash
cd figma-plugin
ls -la manifest.json code.js ui.html ui.js
```

Tous ces fichiers doivent exister dans le même dossier.

#### Vérifier les chemins dans manifest.json :
- `main` doit pointer vers `code.js`
- `ui` doit pointer vers `ui.html`

#### Vérifier le contenu de ui.html :
- Doit contenir `<script src="ui.js"></script>` (chemin relatif, pas absolu)
- Ne doit pas avoir de balises script en double

### Étape 3 : Erreurs courantes et solutions

#### "Cannot find module" ou "ReferenceError"
- **Cause** : Import manquant ou chemin incorrect
- **Solution** : Vérifiez les imports dans `src/code.ts` et `src/ui/`

#### "ui.js is not defined" ou erreur de script
- **Cause** : ui.js n'est pas chargé correctement
- **Solution** : Vérifiez que `ui.html` contient `<script src="ui.js"></script>` (pas `/ui.js`)

#### "Cannot read property of undefined"
- **Cause** : Code qui s'exécute avant que Figma soit prêt
- **Solution** : Vérifiez que le code attend que Figma soit initialisé

#### Erreur de syntaxe dans code.js
- **Cause** : Erreur TypeScript non détectée
- **Solution** : Relancez `npm run build` et vérifiez les erreurs

### Étape 4 : Rebuild complet

```bash
cd figma-plugin
# Nettoyer les anciens fichiers
rm -f code.js ui.js ui.html

# Rebuild
npm run build

# Vérifier
ls -la manifest.json code.js ui.html ui.js
```

### Étape 5 : Recharger le plugin

1. Dans Figma, fermez le plugin s'il est ouvert
2. **Plugins** → **Development** → **Import plugin from manifest...**
3. Sélectionnez `manifest.json` à nouveau
4. Relancez le plugin

### Obtenir de l'aide

Si l'erreur persiste :
1. Copiez le message d'erreur complet de la console
2. Vérifiez la taille des fichiers :
   - `code.js` devrait faire ~9-10 KB
   - `ui.js` devrait faire ~150 KB
   - `ui.html` devrait faire ~550 bytes
3. Partagez ces informations pour diagnostic
