# ✅ Solution : Domaine bloqué

## 🎯 Problème identifié

L'erreur était claire :
```
Image URL https://via.placeholder.com/... does not satisfy the allowedDomains specified in the manifest.json
```

Le domaine `via.placeholder.com` n'était pas autorisé dans le `manifest.json`.

## ✅ Solution appliquée

J'ai ajouté `https://via.placeholder.com` à la liste des domaines autorisés dans `manifest.json`.

## 🔄 Actions à faire

1. **Fermez complètement Figma** (Quit)
2. **Rouvrez Figma**
3. **Reupload le manifest** (car manifest.json a changé)
   - `Plugins` → `Development` → `Import plugin from manifest...`
   - Sélectionnez `manifest.json`
4. **Lancez le plugin**
5. **Générez un nouveau mascot**

## ✅ Résultat attendu

Maintenant vous devriez voir :
- ✅ L'image dans Figma (au centre de votre vue)
- ✅ Le mascot dans la liste (avec l'image à gauche)
- ✅ Plus d'erreur "does not satisfy the allowedDomains"

## 📋 Vérification

Dans la console, vous devriez voir :
```
[Mascot] Attempting to insert demo image: https://via.placeholder.com/...
[Mascot] Inserting image from URL: https://via.placeholder.com/...
[Mascot] Image loaded, hash: ...
[Mascot] Image inserted successfully at: X, Y
```

Plus d'erreur de domaine bloqué !
