# Guide de chargement du plugin dans Figma

## ⚠️ Erreur "Unknown plugin" - Solution

Cette erreur se produit généralement quand Figma ne trouve pas correctement le plugin. Voici les étapes pour résoudre :

### Étape 1 : Vérifier la structure des fichiers

Tous les fichiers doivent être dans le **même dossier** :

```
figma-plugin/
├── manifest.json  ← Doit être exactement ce nom
├── code.js        ← Code du plugin
├── ui.html        ← Interface HTML
└── ui.js          ← Bundle React
```

**Vérification :**
```bash
cd figma-plugin
ls -la manifest.json code.js ui.html ui.js
```

Tous ces fichiers doivent exister et être dans le même dossier.

### Étape 2 : Rebuild complet

```bash
cd figma-plugin
npm run build
```

### Étape 3 : Charger le plugin correctement

**IMPORTANT :** Utilisez Figma Desktop, pas le navigateur web.

1. **Ouvrez Figma Desktop**
2. **Ouvrez ou créez un fichier Figma**
3. **Menu** → **Plugins** → **Development** → **Import plugin from manifest...**
   - **OU** utilisez le raccourci : `Cmd+Option+P` (Mac) / `Ctrl+Alt+P` (Windows)
4. **Sélectionnez le fichier `manifest.json`**
   - Naviguez vers : `/Users/quentin/Documents/Mascot/figma-plugin/manifest.json`
   - **Assurez-vous de sélectionner `manifest.json` et non un autre fichier**

### Étape 4 : Si l'erreur persiste

#### Option A : Supprimer et recharger

1. **Plugins** → **Development** → Supprimez le plugin s'il apparaît dans la liste
2. Rechargez-le avec **Import plugin from manifest...**

#### Option B : Vérifier le contenu de manifest.json

Le fichier doit contenir exactement :
```json
{
  "name": "MascotForge",
  "id": "mascotforge",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": [
      "https://api.mascotforge.com",
      "https://cdn.mascotforge.com"
    ]
  },
  "permissions": [
    "currentuser"
  ]
}
```

#### Option C : Vérifier les permissions

Sur macOS, vérifiez que Figma a accès au dossier :
- **Préférences Système** → **Sécurité et confidentialité** → **Fichiers et dossiers**
- Assurez-vous que Figma a accès aux fichiers

### Étape 5 : Vérifier les erreurs dans la console

1. Dans Figma, ouvrez la console : **Plugins** → **Development** → **Show/Hide console**
2. Rechargez le plugin
3. Notez les erreurs exactes

### Erreurs courantes et solutions

#### "Manifest must be named 'manifest.json'"
- ✅ Vérifiez que le fichier s'appelle exactement `manifest.json` (pas `Manifest.json` ou `MANIFEST.JSON`)
- ✅ Vérifiez qu'il n'y a pas d'espaces dans le nom

#### "Unknown plugin"
- ✅ Vérifiez que tous les fichiers sont dans le même dossier
- ✅ Vérifiez que `code.js` et `ui.html` existent
- ✅ Rebuild avec `npm run build`

#### "Syntax error on line 2"
- Cette erreur peut venir de Figma lui-même (vendor-core)
- Si le plugin se charge malgré cette erreur, vous pouvez l'ignorer
- Si le plugin ne se charge pas, vérifiez `ui.js` avec `node -c ui.js`

### Alternative : Créer un plugin depuis zéro dans Figma

Si rien ne fonctionne, essayez de créer le plugin directement dans Figma :

1. **Plugins** → **Development** → **New Plugin...**
2. Choisissez "With UI and browser APIs"
3. Remplacez le code généré par votre code
4. Copiez `code.js` dans le code du plugin
5. Copiez `ui.html` et `ui.js` dans les fichiers UI

### Vérification finale

Après avoir chargé le plugin :

1. Le plugin devrait apparaître dans : **Plugins** → **Development** → **MascotForge**
2. Cliquez dessus pour l'exécuter
3. Un panneau devrait s'ouvrir sur le côté droit

Si le panneau s'ouvre mais est vide ou affiche une erreur, c'est un problème différent (probablement lié au code React ou à l'API).
