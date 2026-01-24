# Pourquoi le manifest simple ne fonctionne pas

## 🔍 Vérifications à faire

### 1. Vérifier que tous les fichiers existent

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin
ls -la code-simple.js test-minimal.html manifest-simple.json
```

Tous ces fichiers doivent exister dans le même dossier.

### 2. Vérifier le contenu de manifest-simple.json

Le fichier doit pointer vers :
- `main`: `code-simple.js` (doit exister)
- `ui`: `test-minimal.html` (doit exister)

### 3. Vérifier que code-simple.js est valide

```bash
node -c code-simple.js
```

Si erreur → problème de syntaxe

## 🎯 Test avec version ultra-simple

J'ai créé une version encore plus simple (`code-ultra-simple.js`) :

1. **Chargez `manifest-ultra-simple.json`** dans Figma
2. **Vérifiez que les fichiers existent** :
   ```bash
   ls -la code-ultra-simple.js test-minimal.html manifest-ultra-simple.json
   ```

3. **Lancez le plugin**

## 📋 Si "il ne se passe rien"

Cela peut signifier :

1. **Le plugin n'apparaît pas dans la liste** :
   - Vérifiez que vous avez bien importé le manifest
   - Vérifiez que le manifest.json est valide (pas d'erreur JSON)
   - Essayez de fermer et rouvrir Figma

2. **Le plugin apparaît mais ne fait rien** :
   - Ouvrez la console AVANT de lancer
   - Lancez le plugin
   - Regardez ce qui apparaît dans la console

3. **Erreur silencieuse** :
   - Vérifiez la console pour des erreurs
   - Cherchez les messages `[MascotForge]`

## 🔧 Actions immédiates

1. **Vérifier les fichiers** :
   ```bash
   cd /Users/quentin/Documents/Mascot/figma-plugin
   ls -la manifest-*.json code-*.js test-minimal.html
   ```

2. **Tester avec manifest-ultra-simple.json** :
   - Chargez-le dans Figma
   - Vérifiez la console

3. **Vérifier le JSON** :
   ```bash
   cat manifest-simple.json | python3 -m json.tool
   ```
   
   Si erreur → le JSON est invalide

## 💡 Questions importantes

1. **Le plugin apparaît-il dans la liste** (Plugins → Development) ?
   - [ ] Oui, mais ne fait rien
   - [ ] Non, n'apparaît pas du tout

2. **Y a-t-il un message d'erreur** quand vous importez le manifest ?
   - [ ] Oui, quel message ?
   - [ ] Non, pas d'erreur

3. **Que voyez-vous dans la console** quand vous lancez le plugin ?
   - Messages `[MascotForge]` ?
   - Erreurs ?
   - Rien du tout ?
