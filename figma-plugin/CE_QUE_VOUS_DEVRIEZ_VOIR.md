# Ce que vous devriez voir (si tout fonctionne)

## 🎯 Dans la console Figma

### Messages dans l'ordre (tous avec `[Mascot]`) :

1. **`[Mascot] Initializing plugin...`**
   - Apparaît quand le plugin démarre (code.js)

2. **`[Mascot] UI shown successfully`**
   - Apparaît quand l'UI est affichée (code.js)

3. **`[Mascot] ui.html loaded, DOM ready`**
   - Apparaît quand ui.html se charge

4. **`[Mascot] About to load ui.js...`**
   - Apparaît juste avant le chargement de ui.js

5. **`[Mascot] ui.js script tag executed`**
   - Apparaît après la balise `<script src="ui.js">`

6. **`[Mascot] ui.js bundle starting...`**
   - Apparaît quand ui.js commence à s'exécuter

7. **`[Mascot] React imports successful`**
   - Apparaît quand React est chargé

8. **`[Mascot] DOM already ready, initializing immediately...`** (ou `DOM still loading...`)
   - Apparaît quand on vérifie l'état du DOM

9. **`[Mascot] initApp called, looking for root element...`**
   - Apparaît quand on cherche l'élément #root

10. **`[Mascot] Root element found, mounting React app...`**
    - Apparaît quand on trouve l'élément #root

11. **`[Mascot] React app mounted successfully`**
    - Apparaît quand React est monté

12. **`[Mascot] App component mounted`**
    - Apparaît quand le composant App React se monte

13. **`[Mascot] Plugin initialized`**
    - Apparaît quand tout est prêt (code.js)

## 🖼️ Dans l'interface du plugin

### Si vous n'êtes PAS connecté :
- Un écran d'authentification avec :
  - Titre "Mascot"
  - Texte "AI mascot generation for Figma"
  - Bouton "Sign In"
  - Lien "Sign up"

### Si vous êtes connecté :
- Une interface avec 4 onglets en haut :
  - **Character**
  - **Animations**
  - **Logos**
  - **Account**
- Le contenu de l'onglet actif en dessous

## ❌ Ce que vous voyez actuellement

- **Console** : Aucun message `[Mascot]` → Le plugin ne se charge pas
- **Interface** : Écran blanc → L'UI ne se charge pas

## 🔍 Diagnostic

Si vous ne voyez **aucun** message `[Mascot]` dans la console :
→ Le plugin ne se charge pas du tout
→ Vérifiez que vous avez bien reupload le manifest après le rebuild

Si vous voyez les messages 1-2 mais pas les suivants :
→ `ui.html` ne se charge pas
→ Vérifiez que `manifest.json` contient `"ui": "ui.html"`

Si vous voyez les messages 1-5 mais pas les suivants :
→ `ui.js` ne se charge pas (404 ou erreur)
→ Vérifiez l'onglet Network dans la console

## ✅ Prochaines étapes

1. Rebuild : `npm run build`
2. Fermez complètement Figma (Quit)
3. Rouvrez Figma
4. Reupload le manifest
5. Ouvrez la console
6. Lancez le plugin
7. **Envoyez-moi tous les messages `[Mascot]` que vous voyez**
