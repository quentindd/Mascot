/**
 * Script à exécuter une seule fois pour corriger la colonne batchId
 * Ce script peut être exécuté manuellement ou au démarrage
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function fixBatchIdColumn() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connecté à la base de données');

    // Vérifier le type actuel
    const result = await dataSource.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mascots' 
        AND column_name = 'batchId'
    `);

    if (result.length === 0) {
      console.log('⚠️  Colonne batchId non trouvée');
      return;
    }

    const currentType = result[0].data_type;
    console.log(`Type actuel: ${currentType}`);

    if (currentType === 'text' || currentType === 'character varying') {
      console.log('✅ La colonne est déjà de type text');
      return;
    }

    // Modifier le type
    console.log('🔄 Modification du type de batchId...');
    await dataSource.query(`
      ALTER TABLE mascots 
      ALTER COLUMN "batchId" TYPE text USING "batchId"::text
    `);

    console.log('✅ Colonne batchId modifiée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  fixBatchIdColumn()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { fixBatchIdColumn };
