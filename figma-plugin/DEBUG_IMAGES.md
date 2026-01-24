# Guide de débogage : Images générées non visibles

## Problème
Les images générées n'apparaissent ni dans Figma ni dans la liste des mascots du plugin.

## Étapes de diagnostic

### 1. Vérifier l'authentification
- ✅ Le plugin affiche-t-il "Sign In" ou êtes-vous connecté ?
- ✅ Avez-vous entré un token API valide ?

### 2. Tester la génération
1. Ouvrez la console Figma (Menu → Plugins → Development → Mascot → Console)
2. Allez dans l'onglet "Character"
3. Remplissez le formulaire :
   - **Name** : Test Mascot
   - **Prompt** : A cute robot mascot
   - **Style** : kawaii
4. Cliquez sur "Generate Mascot"

### 3. Vérifier les logs dans la console

Cherchez ces messages dans l'ordre :

#### ✅ Messages attendus (succès)
```
[Mascot] Authenticated with API token
[Mascot] Auto-inserting mascot image: https://...
[Mascot] Image loaded, hash: ...
[Mascot] Image inserted successfully at: ...
✅ Mascot "Test Mascot" inserted in Figma!
```

#### ❌ Messages d'erreur possibles

**Erreur 1 : Pas authentifié**
```
[Mascot Error in generate-mascot]: Please sign in to generate mascots
```
→ **Solution** : Cliquez sur "Sign In with API Token" et entrez votre token

**Erreur 2 : URL manquante**
```
[Mascot] No fullBodyImageUrl in mascot response: {...}
```
→ **Solution** : L'API ne retourne pas d'URL d'image. Vérifiez la réponse de l'API.

**Erreur 3 : Domaine bloqué**
```
Failed to load resource: the server responded with a status of 403
Image URL https://... does not satisfy the allowedDomains
```
→ **Solution** : Ajoutez le domaine dans `manifest.json` → `networkAccess.allowedDomains`

**Erreur 4 : Échec de chargement**
```
[Mascot] Failed to auto-insert image: Unable to fetch image
```
→ **Solution** : Vérifiez que l'URL est accessible et que CORS est configuré

**Erreur 5 : Pas de page**
```
[Mascot] Failed to insert image: No page available
```
→ **Solution** : Ouvrez une page dans Figma (créez un nouveau fichier si nécessaire)

### 4. Vérifier la réponse de l'API

Dans la console, cherchez :
```
[Mascot] Auto-inserting mascot image: https://...
```

**Si vous voyez cette ligne** :
- ✅ L'API a retourné une URL
- Vérifiez que l'URL commence par un domaine autorisé (voir `manifest.json`)

**Si vous ne voyez PAS cette ligne** :
- ❌ L'API n'a pas retourné `fullBodyImageUrl`
- Vérifiez la structure de la réponse API dans les logs

### 5. Vérifier les domaines autorisés

Ouvrez `manifest.json` et vérifiez :
```json
"networkAccess": {
  "allowedDomains": [
    "https://api.mascot.com",
    "https://cdn.mascot.com"
  ]
}
```

**Important** : L'URL de l'image doit provenir d'un de ces domaines (ou d'un sous-domaine).

### 6. Vérifier la liste des mascots

1. Après génération, vérifiez l'onglet "Character"
2. La liste des mascots devrait s'afficher en bas
3. Cherchez "Test Mascot" dans la liste

**Si le mascot n'apparaît pas** :
- Vérifiez les logs pour `mascot-generated`
- Vérifiez que `handleGetMascots()` fonctionne

**Si le mascot apparaît mais sans image** :
- Vérifiez que `avatarImageUrl` ou `imageUrl` est présent dans la réponse
- Vérifiez la console pour des erreurs de chargement d'image dans l'UI

## Solutions rapides

### Solution 1 : Vérifier le token API
```bash
# Testez votre token avec curl
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  https://api.mascot.com/api/v1/mascots
```

### Solution 2 : Ajouter un domaine manquant
Si vos images sont hébergées sur un autre domaine, ajoutez-le dans `manifest.json` :
```json
"networkAccess": {
  "allowedDomains": [
    "https://api.mascot.com",
    "https://cdn.mascot.com",
    "https://votre-domaine-images.com"  // ← Ajoutez ici
  ]
}
```

Puis **rebuildez et reuploadez** le manifest :
```bash
npm run build
# Puis reuploadez manifest.json dans Figma
```

### Solution 3 : Vérifier CORS
Si l'image ne charge pas, vérifiez que le serveur d'images autorise les requêtes depuis Figma :
- Headers CORS doivent inclure `Access-Control-Allow-Origin: *` (ou le domaine Figma)

## Prochaines étapes

1. **Testez une génération** et copiez tous les logs de la console
2. **Identifiez le message d'erreur** dans la liste ci-dessus
3. **Appliquez la solution** correspondante
4. **Si ça ne fonctionne toujours pas**, partagez les logs complets

## Logs à partager pour diagnostic

Si le problème persiste, partagez :
1. Tous les logs de la console Figma (filtrez par `[Mascot]`)
2. La réponse complète de l'API (si visible dans les logs)
3. Le domaine où sont hébergées vos images
4. Le message d'erreur exact (si présent)
