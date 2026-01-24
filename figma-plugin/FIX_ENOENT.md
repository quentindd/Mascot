# Solution : Erreur ENOENT - ui.html not found

## Problème
```
Error: ENOENT: no such file or directory, lstat '/Users/quentin/Documents/Mascot/figma-plugin/ui.html'
```

Le fichier existe mais Figma ne le trouve pas. C'est généralement un problème de cache.

## Solution étape par étape

### 1. Vérifier que tous les fichiers existent
```bash
cd /Users/quentin/Documents/Mascot/figma-plugin
ls -la manifest.json code.js ui.html ui.js
```

Tous doivent être présents.

### 2. Supprimer complètement le plugin de Figma

1. **Dans Figma Desktop** :
   - Allez dans : **Plugins** → **Development**
   - Si "MascotForge" apparaît dans la liste, **supprimez-le** (clic droit → Delete ou bouton de suppression)
   - **Fermez complètement Figma Desktop** (Quit, pas juste fermer la fenêtre)

### 3. Nettoyer le cache de Figma (optionnel mais recommandé)

Sur macOS :
```bash
# Fermer Figma d'abord, puis :
rm -rf ~/Library/Application\ Support/Figma/Plugins/*
```

⚠️ **Attention** : Cela supprime TOUS les plugins de développement. Ne faites cela que si vous n'avez pas d'autres plugins importants.

### 4. Rebuild le plugin
```bash
cd /Users/quentin/Documents/Mascot/figma-plugin
npm run build
```

### 5. Recharger le plugin

1. **Rouvrez Figma Desktop**
2. **Ouvrez ou créez un fichier Figma**
3. **Plugins** → **Development** → **Import plugin from manifest...**
4. Naviguez vers : `/Users/quentin/Documents/Mascot/figma-plugin/`
5. **Sélectionnez `manifest.json`**
6. Cliquez sur **Open**

### 6. Si l'erreur persiste

#### Option A : Vérifier les permissions macOS

1. **Préférences Système** → **Sécurité et confidentialité** → **Fichiers et dossiers**
2. Assurez-vous que Figma a accès aux fichiers
3. Si nécessaire, ajoutez Figma manuellement

#### Option B : Vérifier le chemin exact

Le chemin dans l'erreur doit correspondre exactement. Vérifiez :
```bash
cd /Users/quentin/Documents/Mascot/figma-plugin
pwd
# Doit afficher : /Users/quentin/Documents/Mascot/figma-plugin
```

#### Option C : Créer un nouveau dossier de plugin

Parfois, créer un nouveau dossier fonctionne mieux :

```bash
# Créer un nouveau dossier
mkdir -p ~/Desktop/mascotforge-plugin
cd ~/Desktop/mascotforge-plugin

# Copier les fichiers
cp /Users/quentin/Documents/Mascot/figma-plugin/manifest.json .
cp /Users/quentin/Documents/Mascot/figma-plugin/code.js .
cp /Users/quentin/Documents/Mascot/figma-plugin/ui.html .
cp /Users/quentin/Documents/Mascot/figma-plugin/ui.js .

# Charger depuis ce nouveau dossier
```

Puis chargez `manifest.json` depuis `~/Desktop/mascotforge-plugin/`

### 7. Alternative : Créer le plugin directement dans Figma

Si rien ne fonctionne, créez le plugin directement dans Figma :

1. **Plugins** → **Development** → **New Plugin...**
2. Choisissez **"With UI and browser APIs"**
3. Dans l'éditeur de code qui s'ouvre :
   - Remplacez le code par le contenu de `code.js`
4. Pour l'UI :
   - Remplacez le HTML par le contenu de `ui.html`
   - Remplacez le JavaScript par le contenu de `ui.js`

## Vérification finale

Après avoir chargé le plugin :

1. Le plugin devrait apparaître dans : **Plugins** → **Development** → **MascotForge**
2. Cliquez dessus pour l'exécuter
3. Un panneau devrait s'ouvrir sur le côté droit
4. Si le panneau s'ouvre, le problème est résolu !

## Notes importantes

- Les erreurs "Syntax error on line 2" peuvent être ignorées si le plugin fonctionne
- Les erreurs CORS (gravatar.com) sont normales et peuvent être ignorées
- Les erreurs "aria-hidden" sont des avertissements d'accessibilité de Figma, pas critiques
