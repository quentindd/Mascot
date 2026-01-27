# Notes de déploiement - Feature Poses

## ✅ Code prêt pour déploiement

Tous les fichiers nécessaires ont été créés et configurés :

### Backend
- ✅ Entity `Pose` créée
- ✅ DTO `CreatePoseDto` créé
- ✅ Service `PosesService` implémenté
- ✅ Controller `PosesController` avec routes :
  - `POST /api/v1/mascots/:id/poses` - Créer une pose
  - `GET /api/v1/mascots/:id/poses` - Lister les poses d'un mascot
  - `GET /api/v1/poses/:id` - Obtenir une pose
  - `GET /api/v1/poses/:id/status` - Obtenir le statut d'une pose
- ✅ Module `PosesModule` enregistré dans `AppModule`
- ✅ Processor `PoseGenerationProcessor` pour BullMQ
- ✅ Migration créée (`1739200000000-CreatePosesTable.ts`)
- ✅ DataSource configuré pour migrations

### Frontend
- ✅ Tab `PosesTab` créé
- ✅ RPC handlers dans `code.ts`
- ✅ API client méthodes ajoutées
- ✅ Intégration dans `App.tsx`

## 🚀 Déploiement requis

**Le backend en production doit être redéployé** pour que les nouvelles routes soient disponibles.

### Étapes de déploiement

1. **Vérifier que le code compile** :
   ```bash
   cd backend
   npm run build
   ```

2. **Déployer sur Railway** (ou votre plateforme) :
   - Le backend sera redéployé automatiquement si connecté à Git
   - OU déployer manuellement via Railway CLI

3. **Vérifier la migration** :
   - Si `synchronize: true` est activé, la table sera créée automatiquement
   - Sinon, exécuter la migration manuellement après déploiement

4. **Tester les endpoints** :
   - Vérifier que `/api/v1/mascots/:id/poses` répond (pas 404)
   - Tester la création d'une pose via Swagger ou le plugin

## 🔍 Vérifications post-déploiement

1. **Logs du backend** : Vérifier qu'il démarre sans erreur
2. **Table `poses`** : Vérifier qu'elle existe dans la base de données
3. **Routes** : Tester via Swagger UI (`/api/docs`)
4. **Plugin Figma** : Tester la génération d'une pose

## 📝 Notes

- L'erreur 404 actuelle est normale tant que le backend n'est pas redéployé
- La table `poses` sera créée automatiquement si `synchronize: true`
- Les routes suivent le même pattern que `animations` et `logos`
