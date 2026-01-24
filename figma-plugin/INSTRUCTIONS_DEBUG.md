# Instructions pour déboguer l'erreur

## 🎯 Test avec version simple d'abord

Testez d'abord avec la version ultra-simplifiée pour isoler le problème :

### Étape 1 : Charger la version simple

1. **Dans Figma** : Plugins → Development → Import plugin from manifest...
2. **Sélectionnez** : `/Users/quentin/Documents/Mascot/figma-plugin/manifest-simple.json`
3. **Lancez le plugin** : Plugins → Development → MascotForge Simple

### Étape 2 : Vérifier le résultat

- ✅ **Si ça fonctionne** → Le problème vient du code complexe
- ❌ **Si ça ne fonctionne pas** → Le problème vient de la configuration de base

## 🔍 Trouver l'erreur exacte

### Méthode 1 : Console Figma

1. **Ouvrez la console AVANT de lancer le plugin** :
   - Plugins → Development → **Show/Hide console**
   - Laissez la console ouverte

2. **Lancez le plugin**

3. **Cherchez dans la console** :
   - Messages commençant par `[MascotForge]`
   - Erreurs JavaScript (pas les violations CSS)
   - Erreurs qui mentionnent `code.js` ou `ui.js`

4. **Copiez la première erreur** qui apparaît

### Méthode 2 : Message d'erreur rouge

Quand vous voyez "An error occurred while running this plugin" :
1. **Cliquez sur "Show/Hide console"** dans le message d'erreur
2. **Cherchez l'erreur JavaScript** (pas les violations CSS)
3. **Copiez le message d'erreur exact**

## 📋 Informations à partager

Pour que je puisse vous aider, j'ai besoin de :

1. **Le message d'erreur exact** de la console (pas toutes les erreurs, juste la première importante)
2. **Les messages `[MascotForge]`** que vous voyez (ou ne voyez pas)
3. **Résultat du test avec la version simple** :
   - Fonctionne-t-elle ?
   - Même erreur ?

## 🎯 Erreurs à chercher

Dans la console, filtrez pour voir seulement :
- ✅ `Error:` (pas `[Violation]`)
- ✅ `Uncaught Error`
- ✅ `ReferenceError`
- ✅ `TypeError`
- ✅ Messages avec `[MascotForge]`

**Ignorez** :
- ❌ `[Violation] Potential permissions policy violation`
- ❌ `Syntax error on line 2` (dans vendor-core)
- ❌ Erreurs CORS (gravatar.com)
- ❌ Erreurs CSS (@property rule)

## 🛠️ Test rapide

```bash
cd /Users/quentin/Documents/Mascot/figma-plugin

# Vérifier que les fichiers existent
ls -la manifest.json code.js ui.html ui.js

# Vérifier la syntaxe
node -c code.js

# Vérifier le début du fichier
head -10 code.js
```

## 💡 Astuce

Si vous ne voyez **aucun message `[MascotForge]`** dans la console :
- Le code ne s'exécute pas du tout
- Problème de chargement de `code.js`
- Vérifiez que `code.js` existe et est dans le bon dossier

Si vous voyez `[MascotForge] Initializing plugin...` mais pas `[MascotForge] UI shown successfully` :
- L'erreur se produit lors de `figma.showUI()`
- Problème avec `ui.html` ou `__html__`
