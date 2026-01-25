#!/usr/bin/env node

/**
 * Script pour mettre à jour les crédits directement via la base de données
 * Usage: node scripts/update-credits-direct.js
 * 
 * Nécessite les variables d'environnement Railway ou DATABASE_URL
 */

const { Client } = require('pg');

async function updateCredits() {
  // Récupérer DATABASE_URL depuis les variables d'environnement
  const databaseUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Erreur: DATABASE_URL non trouvé');
    console.log('');
    console.log('Pour obtenir DATABASE_URL:');
    console.log('1. Allez sur Railway → Postgres → Variables');
    console.log('2. Copiez la valeur de DATABASE_URL');
    console.log('3. Exécutez: DATABASE_URL="votre_url" node scripts/update-credits-direct.js');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // Essayer les deux formats de colonnes
    console.log('🔄 Mise à jour des crédits...');
    
    // Mettre test@mascot.app à 100
    const result1 = await client.query(`
      UPDATE users 
      SET "creditBalance" = 100 
      WHERE email = 'test@mascot.app'
    `);
    console.log(`   ✓ Format camelCase: ${result1.rowCount} ligne(s) mise(s) à jour`);

    const result2 = await client.query(`
      UPDATE users 
      SET credit_balance = 100 
      WHERE email = 'test@mascot.app'
    `);
    console.log(`   ✓ Format snake_case: ${result2.rowCount} ligne(s) mise(s) à jour`);

    // Mettre tous les utilisateurs à 100
    const result3 = await client.query(`
      UPDATE users 
      SET "creditBalance" = 100 
      WHERE "creditBalance" < 100 OR "creditBalance" IS NULL
    `);
    console.log(`   ✓ Tous les utilisateurs (camelCase): ${result3.rowCount} ligne(s) mise(s) à jour`);

    const result4 = await client.query(`
      UPDATE users 
      SET credit_balance = 100 
      WHERE credit_balance < 100 OR credit_balance IS NULL
    `);
    console.log(`   ✓ Tous les utilisateurs (snake_case): ${result4.rowCount} ligne(s) mise(s) à jour`);

    // Vérifier
    console.log('');
    console.log('📊 Vérification pour test@mascot.app:');
    const check = await client.query(`
      SELECT 
        id, 
        email, 
        COALESCE("creditBalance", credit_balance) as credits,
        plan 
      FROM users 
      WHERE email = 'test@mascot.app'
    `);
    
    if (check.rows.length > 0) {
      const user = check.rows[0];
      console.log(`   Email: ${user.email}`);
      console.log(`   Crédits: ${user.credits}`);
      console.log(`   Plan: ${user.plan}`);
    } else {
      console.log('   ⚠️  Utilisateur test@mascot.app non trouvé');
    }

    console.log('');
    console.log('✅ Mise à jour terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === '42P01') {
      console.error('   La table "users" n\'existe pas');
    } else if (error.code === '42703') {
      console.error('   La colonne n\'existe pas avec ce nom');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateCredits();
