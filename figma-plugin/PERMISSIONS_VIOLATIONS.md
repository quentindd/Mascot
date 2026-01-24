# Permissions Policy Violations - Explication

## ⚠️ Ce sont des AVERTISSEMENTS, pas des erreurs

Les messages `[Violation] Potential permissions policy violation` sont **normaux** et **non bloquants**. Ils apparaissent parce que :

1. **Figma essaie d'accéder à des APIs** (camera, microphone, clipboard, display-capture)
2. **Ces APIs ne sont pas disponibles** dans le contexte d'un plugin Figma
3. **Figma génère ces avertissements** pour informer, mais le plugin fonctionne quand même

## ✅ Vérifier si le plugin fonctionne

**Question importante** : Le plugin s'ouvre-t-il malgré ces avertissements ?

- ✅ **Si OUI** → Les violations peuvent être ignorées, tout fonctionne !
- ❌ **Si NON** → Le problème vient d'ailleurs, pas des violations

## 🔍 Vérifications

### 1. Le panneau s'ouvre-t-il ?

Quand vous lancez le plugin :
- Un panneau apparaît-il sur le côté droit de Figma ?
- Voyez-vous l'interface (tabs, boutons) ?

**Si OUI** → Le plugin fonctionne, ignorez les violations

### 2. Y a-t-il d'autres erreurs ?

Dans la console, cherchez des erreurs qui commencent par :
- ❌ `Error: Unable to load code`
- ❌ `Error: ENOENT`
- ❌ `Uncaught Error` ou `Uncaught TypeError`
- ❌ `Syntax error` (dans votre code, pas dans vendor-core)

**Ces erreurs-là sont importantes**, pas les violations.

## 📋 Erreurs à ignorer vs à noter

### ✅ À IGNORER (normales) :
- `[Violation] Potential permissions policy violation: camera`
- `[Violation] Potential permissions policy violation: microphone`
- `[Violation] Potential permissions policy violation: clipboard-write`
- `[Violation] Potential permissions policy violation: display-capture`
- `Syntax error on line 2` (dans vendor-core, pas votre code)
- `[Local fonts] using agent`
- Erreurs CORS (gravatar.com)

### ❌ À NOTER (problématiques) :
- `Error: Unable to load code`
- `Error: ENOENT: no such file or directory`
- `Error: Unknown plugin`
- `Uncaught Error` dans votre code
- `Uncaught TypeError` dans votre code

## 🎯 Action à prendre

**Si le plugin fonctionne** (panneau s'ouvre, interface visible) :
- ✅ **Ignorez les violations** - tout est normal
- ✅ Le plugin est opérationnel

**Si le plugin ne fonctionne pas** (panneau ne s'ouvre pas, erreurs) :
- ❌ Les violations ne sont pas la cause
- ❌ Partagez les **vraies erreurs** (celles qui commencent par `Error:`)

## 💡 Pourquoi ces violations apparaissent

Figma utilise un iframe pour les plugins UI, et le navigateur génère ces avertissements quand Figma essaie d'accéder à des APIs restreintes. C'est un comportement normal du navigateur, pas un bug de votre plugin.

## 🔧 Si vous voulez réduire les avertissements (optionnel)

Vous pouvez ajouter une meta tag dans `ui.html`, mais ce n'est pas nécessaire :

```html
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), clipboard-write=(), display-capture=()">
```

Mais encore une fois, **ce n'est pas nécessaire** - les violations sont normales et n'empêchent pas le plugin de fonctionner.
