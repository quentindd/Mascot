#!/usr/bin/env node

/**
 * Script pour modifier le type de la colonne batchId de uuid à text
 * Usage: DATABASE_URL="..." node scripts/fix-batchid-column.js
 */

const { Client } = require('pg');

async function fixBatchIdColumn() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL manquant');
    console.log('');
    console.log('Pour obtenir DATABASE_URL:');
    console.log('1. Railway → Postgres → Variables → DATABASE_URL');
    console.log('2. Exécutez: DATABASE_URL="votre_url" node scripts/fix-batchid-column.js');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Vérifier le type actuel
    console.log('🔍 Vérification du type actuel de batchId...');
    const check = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mascots' 
        AND column_name = 'batchId'
    `);

    if (check.rows.length === 0) {
      console.error('❌ Colonne batchId non trouvée dans la table mascots');
      process.exit(1);
    }

    const currentType = check.rows[0].data_type;
    console.log(`   Type actuel: ${currentType}`);

    if (currentType === 'text' || currentType === 'character varying') {
      console.log('✅ La colonne est déjà de type text. Aucune modification nécessaire.');
      return;
    }

    // Modifier le type
    console.log('🔄 Modification du type de batchId de uuid à text...');
    await client.query(`
      ALTER TABLE mascots 
      ALTER COLUMN "batchId" TYPE text USING "batchId"::text
    `);

    // Vérifier le nouveau type
    const verify = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mascots' 
        AND column_name = 'batchId'
    `);

    console.log(`✅ Type modifié avec succès ! Nouveau type: ${verify.rows[0].data_type}`);
    console.log('');
    console.log('🎉 La colonne batchId est maintenant de type text. Vous pouvez tester la génération !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === '42804') {
      console.error('   La colonne ne peut pas être convertie directement. Essayez de supprimer les données d\'abord.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixBatchIdColumn();
