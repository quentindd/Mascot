# Test du manifest simple - Diagnostic

## 🔍 Vérifications effectuées

✅ Tous les fichiers existent :
- `manifest-simple.json` ✓
- `code-simple.js` ✓
- `test-minimal.html` ✓

✅ Le JSON est valide
✅ La syntaxe de code-simple.js est correcte

## ❓ "Il ne se passe rien" - Que cela signifie-t-il ?

### Scénario 1 : Le plugin n'apparaît pas dans la liste

**Symptômes** :
- Vous importez `manifest-simple.json`
- Mais "MascotForge Simple" n'apparaît pas dans Plugins → Development

**Solutions** :
1. Vérifiez que vous avez bien sélectionné `manifest-simple.json` (pas `manifest.json`)
2. Fermez et rouvrez Figma Desktop complètement
3. Vérifiez qu'il n'y a pas d'erreur lors de l'import

### Scénario 2 : Le plugin apparaît mais ne fait rien

**Symptômes** :
- "MascotForge Simple" apparaît dans la liste
- Mais quand vous cliquez dessus, rien ne se passe

**Solutions** :
1. **Ouvrez la console AVANT de lancer** :
   - Plugins → Development → Show/Hide console
2. **Lancez le plugin**
3. **Regardez la console** :
   - Voyez-vous `[MascotForge] Starting plugin...` ?
   - Y a-t-il des erreurs ?

### Scénario 3 : Erreur silencieuse

**Symptômes** :
- Le plugin apparaît
- Mais aucun panneau ne s'ouvre
- Pas de message d'erreur visible

**Solutions** :
1. Vérifiez la console (voir Scénario 2)
2. Testez avec `manifest-ultra-simple.json` (version encore plus simple)

## 🎯 Test avec version ultra-simple

J'ai créé `manifest-ultra-simple.json` avec un code encore plus basique :

1. **Chargez `manifest-ultra-simple.json`** dans Figma
2. **Vérifiez la console** quand vous le lancez
3. **Voyez-vous `[MascotForge] Plugin starting...` ?**

## 📋 Informations à partager

Pour que je puisse vous aider, dites-moi :

1. **Le plugin apparaît-il dans la liste** ?
   - [ ] Oui, "MascotForge Simple" est visible
   - [ ] Non, il n'apparaît pas

2. **Quand vous cliquez dessus** :
   - [ ] Un panneau s'ouvre (même vide)
   - [ ] Rien ne se passe du tout
   - [ ] Un message d'erreur apparaît

3. **Dans la console** (après avoir lancé le plugin) :
   - [ ] Je vois `[MascotForge] Starting plugin...`
   - [ ] Je vois des erreurs
   - [ ] Je ne vois rien de nouveau

4. **Y a-t-il un message d'erreur** quand vous importez le manifest ?
   - [ ] Oui, quel message ?
   - [ ] Non, pas d'erreur

## 🔧 Actions immédiates

1. **Testez avec manifest-ultra-simple.json** :
   ```bash
   # Les fichiers sont prêts
   ls -la manifest-ultra-simple.json code-ultra-simple.js test-minimal.html
   ```

2. **Ouvrez la console AVANT de lancer** le plugin

3. **Notez exactement ce qui se passe** :
   - Le plugin apparaît-il ?
   - Que voyez-vous dans la console ?
   - Un panneau s'ouvre-t-il ?
