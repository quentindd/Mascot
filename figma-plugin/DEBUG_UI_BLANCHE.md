# 🔍 Debug : Interface blanche

## Étape 1 : Ouvrir la console Figma

1. Dans Figma, allez dans le menu : **View → Toggle Developer Console**
   - Ou utilisez le raccourci : `Cmd+Option+I` (Mac) ou `Ctrl+Shift+I` (Windows/Linux)

2. La console s'ouvre en bas de l'écran

## Étape 2 : Vérifier les messages

Cherchez les messages qui commencent par `[Mascot]` :

### ✅ Si vous voyez ces messages :
```
[Mascot] Initializing plugin...
[Mascot] UI shown successfully
[Mascot] Mounting React app...
[Mascot] React app mounted successfully
[Mascot] App component mounted
```
→ Le code se charge, mais il y a peut-être une erreur dans le rendu React.

### ❌ Si vous NE voyez PAS ces messages :
→ Le script `ui.js` ne se charge peut-être pas.

### ❌ Si vous voyez une erreur :
→ Copiez l'erreur complète et envoyez-la moi.

## Étape 3 : Vérifier les erreurs

Regardez s'il y a des erreurs en rouge dans la console :
- Erreurs JavaScript
- Erreurs de chargement de fichiers
- Erreurs de syntaxe

## 📸 Capture d'écran

Si possible, faites une capture d'écran de la console et envoyez-la moi.
