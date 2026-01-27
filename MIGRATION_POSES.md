# Migration Poses - Instructions

## ✅ Fichiers créés

1. **`backend/src/config/data-source.ts`** : Configuration DataSource pour TypeORM migrations
2. **`backend/src/migrations/1739200000000-CreatePosesTable.ts`** : Migration pour créer la table `poses`

## 🚀 Exécution de la migration

### Option 1 : Via synchronize (recommandé si activé)

Si `synchronize: true` est activé dans `database.config.ts`, la table sera créée automatiquement au démarrage du backend. Pas besoin de migration manuelle.

### Option 2 : Migration manuelle

Si vous voulez exécuter la migration manuellement :

```bash
cd backend
npm run migration:run
```

**Note** : Assurez-vous que :
- La base de données PostgreSQL est accessible
- Les variables d'environnement sont configurées (`.env` ou `.env.local`)
- Les variables `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` sont définies

## 📋 Structure de la table `poses`

```sql
CREATE TABLE poses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdById" UUID NOT NULL,
  "mascotId" UUID NOT NULL,
  prompt TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  "imageUrl" TEXT,
  "errorMessage" TEXT,
  "figmaFileId" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key
ALTER TABLE poses 
ADD CONSTRAINT FK_poses_mascotId 
FOREIGN KEY ("mascotId") REFERENCES mascots(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IDX_poses_mascotId ON poses("mascotId");
CREATE INDEX IDX_poses_status ON poses(status);
```

## ✅ Vérification

Une fois la migration exécutée ou le backend démarré avec `synchronize: true`, vous pouvez vérifier que la table existe :

```sql
SELECT * FROM information_schema.tables WHERE table_name = 'poses';
```

## 🔧 Notes techniques

- Le champ `status` utilise `varchar` au lieu d'`enum` dans la migration (TypeORM a des problèmes avec les enums dans les migrations)
- L'entité `Pose` utilise toujours l'enum `PoseStatus` dans le code TypeScript
- La foreign key vers `mascots` est en CASCADE DELETE (si un mascot est supprimé, ses poses le sont aussi)
