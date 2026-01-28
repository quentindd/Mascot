#!/usr/bin/env node

/**
 * Script pour mettre à jour les crédits directement.
 * Charge .env du backend si DATABASE_URL n'est pas défini.
 * Usage: cd backend && node scripts/update-credits.js
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// Charger .env du backend si présent
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (m) {
        process.env.DATABASE_URL = m[1].replace(/^["']|["']$/g, '').trim();
        break;
      }
    }
  }
}

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

  // Désactiver SSL pour les bases locales (localhost, 127.0.0.1), sinon laisser SSL activé
  const isLocal =
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1') ||
    databaseUrl.includes('@host.docker.internal');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Mettre à jour : tous les utilisateurs à 100 crédits (colonne TypeORM = "creditBalance")
    const queries = [
      `UPDATE users SET "creditBalance" = 100 WHERE email = 'test@mascot.app'`,
      `UPDATE users SET "creditBalance" = 100`,
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

    // Vérifier tous les users (colonne = "creditBalance")
    const check = await client.query(`
      SELECT email, "creditBalance" as credits
      FROM users
      ORDER BY email
      LIMIT 20
    `);

    if (check.rows.length > 0) {
      console.log('');
      console.log('📊 Crédits mis à jour:');
      check.rows.forEach((r) => console.log(`   ${r.email}: ${r.credits}`));
      console.log('');
      console.log('✅ Terminé !');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message || error.code || String(error));
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateCredits();
