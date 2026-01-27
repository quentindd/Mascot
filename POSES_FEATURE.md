# 🎭 Système de Poses - Documentation

## Vue d'ensemble

Le système de poses permet aux utilisateurs de générer plusieurs poses statiques pour leurs mascots, idéal pour les développeurs qui construisent des apps et ont besoin de différentes expressions/poses pour différents états de l'application.

## ✅ Frontend (Complété)

### Onglet Poses
- **Localisation**: `figma-plugin/src/ui/tabs/PosesTab.tsx`
- **Fonctionnalités**:
  - Sélection multiple de poses (10 poses disponibles)
  - Interface visuelle avec icônes et descriptions
  - Sélection/désélection globale (Select All / Deselect All)
  - Choix de résolution (256px, 512px, 1024px)
  - Affichage des poses générées
  - Insertion en pack dans Figma

### Poses disponibles
1. **Idle** 😐 - Pose neutre debout
2. **Happy** 😊 - Souriant et joyeux
3. **Excited** 🤩 - Énergique et enthousiaste
4. **Sad** 😢 - Triste et mélancolique
5. **Thinking** 🤔 - Pose contemplative
6. **Waving** 👋 - Gesture de salutation
7. **Celebrating** 🎉 - Pose de victoire
8. **Sleeping** 😴 - Pose de repos
9. **Working** 💼 - Concentré et productif
10. **Surprised** 😲 - Expression de surprise

### Navigation
- Nouvel onglet "Poses" ajouté dans la sidebar
- Positionné entre "Logos" et "Gallery"

## 🔨 Backend (À implémenter)

### Endpoint à créer

```typescript
POST /api/v1/mascots/:mascotId/poses
Body: {
  poses: string[]; // ['idle', 'happy', 'excited', ...]
  resolution: number; // 256, 512, 1024
}
```

### Service à créer

**Fichier**: `backend/src/modules/poses/poses.service.ts`

**Fonctionnalités nécessaires**:
1. Génération batch de poses (plusieurs poses en parallèle)
2. Utilisation de Gemini Flash pour générer chaque pose
3. Stockage des images dans Supabase Storage
4. Retour d'un tableau de poses avec URLs

**Structure de données**:
```typescript
interface Pose {
  id: string;
  mascotId: string;
  pose: string; // 'idle', 'happy', etc.
  imageUrl: string;
  resolution: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Controller à créer

**Fichier**: `backend/src/modules/poses/poses.controller.ts`

**Endpoints**:
- `POST /mascots/:id/poses` - Générer des poses
- `GET /mascots/:id/poses` - Récupérer les poses d'un mascot
- `GET /poses/:id` - Récupérer une pose spécifique

### Module à créer

**Fichier**: `backend/src/modules/poses/poses.module.ts`

## 📋 Prochaines étapes

1. **Créer le module backend**:
   - Entity Pose (TypeORM)
   - Service avec génération batch
   - Controller avec endpoints REST
   - Module NestJS

2. **Intégrer avec Gemini Flash**:
   - Créer des prompts spécifiques pour chaque pose
   - Générer les images en parallèle
   - Gérer les erreurs individuellement

3. **Ajouter dans la galerie**:
   - Afficher les poses dans la galerie
   - Permettre l'insertion individuelle ou en pack
   - Filtrer par mascot

4. **Améliorer l'UX**:
   - Afficher la progression de génération
   - Permettre la génération sélective (regénérer une pose)
   - Export en pack ZIP pour les développeurs

## 💡 Idées d'amélioration

- **Poses personnalisées**: Permettre aux utilisateurs de créer leurs propres poses avec un prompt
- **Templates de poses**: Packs pré-configurés (ex: "Emotions Pack", "Actions Pack")
- **Variations**: Générer plusieurs variations d'une même pose
- **Export formats**: Export direct en formats optimisés pour mobile (PNG, WebP, etc.)
