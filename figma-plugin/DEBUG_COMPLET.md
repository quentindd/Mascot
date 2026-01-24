# Guide de débogage complet

## 🔍 Diagnostic étape par étape

### Étape 1 : Tester avec la version minimale

J'ai créé une version minimale du plugin pour tester. Utilisez-la d'abord :

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Compiler la version de test
npx tsc test-minimal-code.ts --outDir . --target ES2020 --module commonjs --lib ES2020

# Vérifier les fichiers
ls -la test-minimal-*
```

Puis chargez `test-minimal-manifest.json` dans Figma.

**Si la version minimale fonctionne** → Le problème vient du code React/complexe
**Si la version minimale ne fonctionne pas** → Le problème vient de la configuration Figma

### Étape 2 : Vérifier les erreurs exactes

**Important** : Copiez les **premières erreurs** de la console, pas toutes. Les erreurs importantes sont généralement au début.

Les erreurs à ignorer :
- ❌ "Syntax error on line 2" (vient de Figma, pas de votre code)
- ❌ Erreurs CORS (gravatar.com)
- ❌ "aria-hidden" warnings
- ❌ "Local fonts" messages

Les erreurs à noter :
- ✅ "Error: Unable to load code"
- ✅ "ENOENT: no such file or directory"
- ✅ "Unknown plugin"
- ✅ Erreurs JavaScript dans votre code

### Étape 3 : Vérifier la structure des fichiers

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Tous ces fichiers doivent exister dans le même dossier
ls -la manifest.json code.js ui.html ui.js

# Vérifier les tailles (doivent être > 0)
wc -l manifest.json code.js ui.html ui.js
```

### Étape 4 : Vérifier le contenu de ui.html

```bash
cat ui.html
```

Doit contenir :
- `<script src="ui.js"></script>` (pas `/ui.js`)
- Pas de balises script en double
- Pas de chemins absolus

### Étape 5 : Vérifier la syntaxe de code.js

```bash
node -c code.js
```

Si erreur → problème de compilation TypeScript

### Étape 6 : Rebuild complet

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Nettoyer
rm -f code.js ui.js ui.html

# Rebuild
npm run build

# Vérifier
ls -la manifest.json code.js ui.html ui.js
```

### Étape 7 : Nettoyer le cache Figma

1. **Fermez complètement Figma Desktop**
2. Supprimez le cache :
   ```bash
   rm -rf ~/Library/Application\ Support/Figma/Plugins/*
   ```
3. **Rouvrez Figma**
4. Rechargez le plugin

### Étape 8 : Vérifier les permissions macOS

1. **Préférences Système** → **Sécurité et confidentialité** → **Fichiers et dossiers**
2. Vérifiez que Figma a accès aux fichiers
3. Si nécessaire, ajoutez Figma manuellement

## 🐛 Problèmes courants et solutions

### Problème : "ENOENT: no such file or directory"

**Cause** : Figma ne trouve pas le fichier (cache ou chemin incorrect)

**Solution** :
1. Vérifiez que le fichier existe : `ls -la ui.html`
2. Supprimez le plugin de Figma
3. Fermez Figma complètement
4. Rechargez le plugin

### Problème : "Unknown plugin"

**Cause** : Le plugin n'est pas correctement enregistré

**Solution** :
1. Supprimez le plugin de Figma
2. Nettoyez le cache : `rm -rf ~/Library/Application\ Support/Figma/Plugins/*`
3. Rechargez le plugin

### Problème : "Syntax error" dans ui.js

**Cause** : Problème de build ou format incorrect

**Solution** :
1. Vérifiez la syntaxe : `node -c ui.js`
2. Rebuild : `npm run build`
3. Vérifiez que ui.js commence par `(function(){`

### Problème : Le panneau s'ouvre mais est vide

**Cause** : Erreur JavaScript dans le code React

**Solution** :
1. Ouvrez la console Figma
2. Cherchez les erreurs JavaScript (pas les warnings)
3. Vérifiez les imports dans `src/ui/`

## 📋 Checklist de vérification

Avant de signaler une erreur, vérifiez :

- [ ] Tous les fichiers existent (manifest.json, code.js, ui.html, ui.js)
- [ ] Les fichiers sont dans le même dossier
- [ ] `npm run build` s'exécute sans erreur
- [ ] `node -c code.js` ne retourne pas d'erreur
- [ ] `ui.html` contient `<script src="ui.js"></script>`
- [ ] Le plugin a été supprimé et rechargé dans Figma
- [ ] Figma Desktop est complètement fermé et rouvert
- [ ] Le cache Figma a été nettoyé

## 🆘 Si rien ne fonctionne

1. **Testez la version minimale** (`test-minimal-manifest.json`)
2. **Créez un nouveau plugin dans Figma** :
   - Plugins → Development → New Plugin...
   - Copiez le code manuellement
3. **Partagez les erreurs exactes** :
   - Copiez les 5-10 premières lignes d'erreur de la console
   - Indiquez à quelle étape ça échoue (chargement, ouverture du panneau, etc.)

## 📝 Format pour signaler une erreur

Quand vous partagez une erreur, incluez :

1. **Message d'erreur exact** (les 3-5 premières lignes)
2. **Étape où ça échoue** :
   - Chargement du manifest ?
   - Ouverture du plugin ?
   - Affichage de l'UI ?
3. **Résultat de** :
   ```bash
   ls -la manifest.json code.js ui.html ui.js
   node -c code.js
   ```
