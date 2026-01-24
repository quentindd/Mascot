# Debug : Image ne s'affiche pas

## 🔍 Problèmes identifiés

1. **Dans la liste** : Le code cherchait `avatarImageUrl` mais le mock avait seulement `imageUrl`
2. **Insertion dans Figma** : L'image placeholder peut ne pas se charger (CORS ou timeout)

## ✅ Corrections appliquées

1. ✅ Ajout de `avatarImageUrl` dans le mock mascot
2. ✅ Ajout de `status: 'completed'` pour l'affichage
3. ✅ Support de `imageUrl` en fallback dans l'UI
4. ✅ Ajout de logs détaillés pour le debug
5. ✅ Gestion d'erreur pour les images qui ne se chargent pas

## 🧪 Test

1. Rechargez le plugin
2. Générez un nouveau mascot
3. Vérifiez :
   - **Dans la liste** : L'image devrait apparaître à gauche du nom
   - **Dans Figma** : L'image devrait être insérée sur la page
   - **Console** : Regardez les logs `[Mascot] Inserting image...`

## 🐛 Si ça ne marche toujours pas

### Vérifiez la console :
- Cherchez les messages `[Mascot] Inserting image...`
- Regardez s'il y a des erreurs

### Vérifiez dans Figma :
- Êtes-vous sur une page (pas sur un fichier vide) ?
- L'image peut être très petite si vous avez zoomé loin
- Utilisez `Cmd+Shift+1` pour voir toute la page

### Vérifiez la liste :
- Le mascot apparaît-il dans la liste ?
- Y a-t-il une image à gauche du nom ?
- Si non, ouvrez la console et regardez les erreurs d'image
