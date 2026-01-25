#!/usr/bin/env node

/**
 * Script pour mettre à jour les crédits directement
 * Usage: cd backend && DATABASE_URL="..." node scripts/update-credits.js
 */

const { Client } = require('pg');

async function updateCredits() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL manquant');
    console.log('');
    console.log('Pour obtenir DATABASE_URL:');
    console.log('1. Railway → Postgres → Variables → DATABASE_URL');
    console.log('2. Exécutez: DATABASE_URL="votre_url" node scripts/update-credits.js');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Mettre à jour (essayer les deux formats)
    const queries = [
      `UPDATE users SET "creditBalance" = 100 WHERE email = 'test@mascot.app'`,
      `UPDATE users SET credit_balance = 100 WHERE email = 'test@mascot.app'`,
      `UPDATE users SET "creditBalance" = 100 WHERE "creditBalance" < 100`,
      `UPDATE users SET credit_balance = 100 WHERE credit_balance < 100`,
    ];

    for (const query of queries) {
      try {
        const result = await client.query(query);
        if (result.rowCount > 0) {
          console.log(`✓ ${result.rowCount} ligne(s) mise(s) à jour`);
        }
      } catch (e) {
        // Ignorer les erreurs de colonne inexistante
        if (!e.message.includes('column') && !e.message.includes('does not exist')) {
          console.warn(`⚠ ${e.message}`);
        }
      }
    }

    // Vérifier
    const check = await client.query(`
      SELECT email, 
             COALESCE("creditBalance", credit_balance, 0) as credits
      FROM users 
      WHERE email = 'test@mascot.app'
    `);

    if (check.rows.length > 0) {
      console.log('');
      console.log('📊 Résultat:');
      console.log(`   Email: ${check.rows[0].email}`);
      console.log(`   Crédits: ${check.rows[0].credits}`);
      console.log('');
      console.log('✅ Terminé !');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateCredits();
