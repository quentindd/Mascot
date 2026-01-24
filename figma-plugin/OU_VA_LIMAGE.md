# Où va l'image générée ?

## 📍 Emplacement de l'image

Quand vous générez un mascot, l'image est automatiquement insérée dans Figma :

### 1. **Sur la page actuelle**
- L'image apparaît sur la page Figma que vous avez ouverte
- Elle est créée comme un **rectangle** avec l'image en remplissage

### 2. **Position : Centre de la vue**
- L'image est placée au **centre de votre vue actuelle** (viewport)
- Si vous avez zoomé/déplacé la vue, l'image apparaît là où vous regardez

### 3. **Taille par défaut**
- **512x512 pixels** (taille par défaut)
- Vous pouvez la redimensionner après insertion

### 4. **Sélection automatique**
- L'image est **automatiquement sélectionnée** après insertion
- Figma fait un zoom pour la montrer (scrollAndZoomIntoView)

## 🎯 Comment la trouver ?

### Si vous ne voyez pas l'image :

1. **Vérifiez que vous êtes sur une page**
   - L'image ne peut pas être créée si vous n'êtes pas sur une page Figma

2. **Regardez au centre de votre vue**
   - L'image apparaît là où vous regardez actuellement
   - Si vous avez zoomé très loin, elle peut être petite

3. **Vérifiez le calque dans le panneau de gauche**
   - Cherchez un rectangle avec le nom de votre mascot
   - Exemple : "My Mascot" ou le nom que vous avez donné

4. **Utilisez "Zoom to fit"**
   - `Cmd+Shift+1` (Mac) ou `Ctrl+Shift+1` (Windows)
   - Pour voir toute la page et trouver l'image

## 🔧 Améliorations possibles

Si vous voulez changer où l'image apparaît, on peut :
- L'insérer à une position fixe (ex: en haut à gauche)
- L'insérer à la position du curseur
- Créer un frame dédié pour les mascots
- Demander à l'utilisateur où il veut l'image

## 📝 Note technique

Le code actuel fait :
```typescript
// Centre sur viewport
const viewport = figma.viewport.center;
node.x = viewport.x - 256;  // 256 = moitié de 512
node.y = viewport.y - 256;
```

Cela place l'image au centre de ce que vous voyez actuellement.
