# Diagnostic complet - Plugin ne fonctionne pas

## 🔍 Questions de diagnostic

### 1. Le plugin apparaît-il dans la liste ?

Après avoir importé le manifest :
- Allez dans : **Plugins** → **Development**
- Voyez-vous le plugin dans la liste ?

**Si NON** :
- Le manifest n'a pas été chargé
- Vérifiez qu'il n'y a pas d'erreur lors de l'import
- Essayez de fermer et rouvrir Figma

**Si OUI** → Passez à la question 2

### 2. Que se passe-t-il quand vous cliquez sur le plugin ?

- [ ] **Un panneau s'ouvre** (même vide) → Le plugin fonctionne partiellement
- [ ] **Rien ne se passe** → Le code ne s'exécute pas
- [ ] **Un message d'erreur** → Copiez le message exact

### 3. Que voyez-vous dans la console ?

**IMPORTANT** : Ouvrez la console AVANT de lancer le plugin

1. **Plugins** → **Development** → **Show/Hide console**
2. **Effacez la console** (icône Clear)
3. **Lancez le plugin**
4. **Regardez ce qui apparaît**

Voyez-vous :
- `[MascotForge]` messages ?
- Des erreurs JavaScript ?
- Rien du tout ?

## 🎯 Test avec version minimale

J'ai créé `code-minimal.js` - la version la plus simple possible :

1. **Chargez `manifest-minimal.json`** dans Figma
2. **Vérifiez qu'il apparaît dans la liste**
3. **Lancez-le**
4. **Un panneau devrait s'ouvrir avec "Test"**

Si même ça ne fonctionne pas → Le problème vient de la configuration Figma, pas du code.

## 📋 Checklist de vérification

Avant de tester, vérifiez :

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Tous ces fichiers doivent exister
ls -la manifest-minimal.json code-minimal.js test-minimal.html

# Le JSON doit être valide
cat manifest-minimal.json | python3 -m json.tool

# Le code doit être syntaxiquement correct
node -c code-minimal.js
```

## 🔧 Si le plugin n'apparaît pas dans la liste

1. **Vérifiez le chemin** :
   - Le manifest doit être dans `/Users/quentin/Documents/Mascot/figma-plugin/`
   - Tous les fichiers doivent être dans le même dossier

2. **Vérifiez le JSON** :
   ```bash
   cat manifest-minimal.json | python3 -m json.tool
   ```
   Si erreur → le JSON est invalide

3. **Fermez et rouvrez Figma** complètement

4. **Réessayez l'import**

## 🔧 Si le plugin apparaît mais ne fait rien

1. **Ouvrez la console AVANT de lancer**
2. **Lancez le plugin**
3. **Regardez la console** :
   - Y a-t-il des erreurs ?
   - Y a-t-il des messages de log ?

4. **Testez avec `manifest-minimal.json`** (version la plus simple)

## 💡 Informations à partager

Pour que je puisse vous aider, dites-moi :

1. **Le plugin apparaît-il dans la liste ?** (Oui/Non)
2. **Que se passe-t-il quand vous cliquez dessus ?**
3. **Que voyez-vous dans la console ?** (copiez les premières lignes)
4. **Y a-t-il un message d'erreur visible ?** (dans Figma, pas la console)
