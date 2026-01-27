# Vérification des routes Poses

## Routes attendues

Avec le préfixe global `/api/v1`, les routes suivantes devraient être disponibles :

1. `POST /api/v1/mascots/:id/poses` - Créer une pose
2. `GET /api/v1/mascots/:id/poses` - Lister les poses d'un mascot
3. `GET /api/v1/poses/:id` - Obtenir une pose
4. `GET /api/v1/poses/:id/status` - Obtenir le statut d'une pose

## Vérification

### 1. Vérifier que le module est importé

```bash
grep -r "PosesModule" backend/src/app.module.ts
```

Devrait retourner :
```
import { PosesModule } from './modules/poses/poses.module';
PosesModule,
```

### 2. Vérifier que le contrôleur est enregistré

```bash
grep -r "PosesController" backend/src/modules/poses/poses.module.ts
```

Devrait retourner :
```
controllers: [PosesController],
```

### 3. Vérifier que le build fonctionne

```bash
cd backend
npm run build
```

### 4. Vérifier les routes au démarrage

Au démarrage du backend, NestJS devrait logger toutes les routes enregistrées. Chercher dans les logs :
- `POST /api/v1/mascots/:id/poses`
- `GET /api/v1/mascots/:id/poses`

### 5. Tester via Swagger

Une fois le backend démarré, aller sur :
- `http://localhost:3000/api/docs` (ou votre URL)
- Chercher le tag "poses"
- Vérifier que les endpoints sont listés

## Si les routes ne sont pas disponibles

1. **Vérifier que le backend a été redéployé** (si en production)
2. **Vérifier les logs de démarrage** pour voir si le module est chargé
3. **Vérifier que le build a réussi** sans erreurs
4. **Vérifier que la table `poses` existe** (si synchronize: false)
