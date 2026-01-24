# Diagnostic : Image générée mais invisible

## 🔍 Problème

L'image est générée mais vous ne la voyez :
- ❌ Ni dans Figma (sur la page)
- ❌ Ni dans la liste des mascots (dans le plugin)

## ✅ Actions de diagnostic

### 1. Ouvrir la console

1. Dans Figma : `View` → `Toggle Developer Console`
2. OU : `Cmd+Option+I` (Mac) ou `Ctrl+Shift+I` (Windows)

### 2. Générer un nouveau mascot

1. Remplissez le formulaire
2. Cliquez sur "Generate Mascot"
3. **Regardez immédiatement la console**

### 3. Messages à chercher

Vous devriez voir (dans l'ordre) :

```
[Mascot] Attempting to insert demo image: https://via.placeholder.com/...
[Mascot] Inserting image from URL: https://via.placeholder.com/...
[Mascot] Image loaded, hash: ...
[Mascot] Image inserted successfully at: X, Y
[Mascot] Adding mascot to list: {...}
[Mascot] Updated mascots list: [...]
```

### 4. Si vous voyez des erreurs

**Erreur "No page available"** :
- ✅ Solution : Ouvrez une page dans Figma (pas un fichier vide)

**Erreur "Failed to load image"** :
- ✅ Solution : Problème de chargement de l'image placeholder
- ✅ Solution : Vérifiez votre connexion internet

**Erreur "Failed to insert image"** :
- ✅ Solution : Vérifiez que vous êtes sur une page Figma
- ✅ Solution : Regardez le message d'erreur complet

**Aucun message `[Mascot]`** :
- ✅ Solution : Le code ne s'exécute pas, vérifiez que le plugin est bien chargé

## 🧪 Test simple

1. **Ouvrez la console**
2. **Générez un mascot**
3. **Copiez TOUS les messages** qui commencent par `[Mascot]`
4. **Envoyez-moi ces messages**

## 📋 Checklist

- [ ] Console ouverte
- [ ] Page Figma ouverte (pas fichier vide)
- [ ] Mascot généré
- [ ] Messages `[Mascot]` visibles dans la console
- [ ] Erreurs copiées (s'il y en a)

## 🎯 Ce que je vais vérifier

Avec les messages de la console, je pourrai voir :
1. Si l'image est bien créée
2. Si l'insertion dans Figma fonctionne
3. Si l'ajout à la liste fonctionne
4. Où exactement ça bloque
