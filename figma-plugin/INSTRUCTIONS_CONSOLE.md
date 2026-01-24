# Instructions : Vérifier la console

## 🔍 Ce que je vois dans votre capture

Les erreurs que vous voyez sont de **Figma lui-même**, pas de notre plugin :
- `vendor-core-21d798e3...min.js.br` → Code de Figma
- `figma_app-...min.css.br` → CSS de Figma

**Problème :** Je ne vois **aucun message `[Mascot]`**, ce qui signifie que notre script `ui.js` ne s'exécute peut-être pas.

## ✅ Actions à faire

### 1. Filtrer la console pour voir nos messages

Dans la console Figma, cherchez :
- Un champ de recherche/filtre (en haut de la console)
- Tapez : `Mascot`
- Cela filtrera pour ne montrer que nos messages

### 2. Vérifier les onglets de la console

La console peut avoir plusieurs onglets :
- **Console** (messages généraux)
- **Errors** (erreurs uniquement)
- **Warnings** (avertissements)

Vérifiez l'onglet **Console** ou **Errors**.

### 3. Recharger le plugin

1. Fermez le panneau du plugin (bouton X)
2. Relancez le plugin : **Plugins → Development → Mascot**
3. Regardez immédiatement la console

### 4. Chercher ces messages

Vous devriez voir (dans l'ordre) :
```
[Mascot] ui.html loaded, about to load ui.js...
[Mascot] ui.js script tag executed
[Mascot] ui.js bundle loaded, starting execution...
[Mascot] React imports successful
[Mascot] initApp called, looking for root element...
[Mascot] Root element found, mounting React app...
[Mascot] React app mounted successfully
[Mascot] App component mounted
```

### 5. Si vous ne voyez AUCUN message `[Mascot]`

Cela signifie que `ui.js` ne se charge pas. Vérifiez :
- Que `ui.js` existe dans le dossier du plugin
- Qu'il fait ~150KB
- Qu'il n'y a pas d'erreur de chargement dans la console

## 📸 Envoyez-moi

1. Une capture d'écran de la console **filtrée par "Mascot"**
2. OU une capture de toutes les erreurs (onglet Errors)
3. Les messages que vous voyez (ou ne voyez pas)
