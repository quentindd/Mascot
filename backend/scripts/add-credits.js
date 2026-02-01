#!/usr/bin/env node

/**
 * Script pour ajouter des crédits à un utilisateur par email.
 * Usage: cd backend && node scripts/add-credits.js dimpre.quentin@gmail.com 7
 * Ou: DATABASE_URL="..." node scripts/add-credits.js dimpre.quentin@gmail.com 7
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const email = process.argv[2] || 'dimpre.quentin@gmail.com';
const amount = parseInt(process.argv[3] || '7', 10);

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

async function addCredits() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL manquant');
    console.log('');
    console.log('Usage: cd backend && node scripts/add-credits.js <email> <amount>');
    console.log('Exemple: node scripts/add-credits.js dimpre.quentin@gmail.com 7');
    process.exit(1);
  }

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

    // Récupérer l'utilisateur et son solde actuel
    const userRes = await client.query(
      `SELECT id, email, "creditBalance" FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (userRes.rows.length === 0) {
      console.error(`❌ Utilisateur non trouvé: ${email}`);
      process.exit(1);
    }

    const user = userRes.rows[0];
    const balanceBefore = parseInt(user.creditBalance, 10) || 0;
    const balanceAfter = balanceBefore + amount;

    // Insérer une entrée dans credit_ledger (admin_adjustment)
    await client.query(
      `INSERT INTO credit_ledger ("userId", type, amount, "balanceAfter", status, description, "createdAt")
       VALUES ($1, 'admin_adjustment', $2, $3, 'completed', $4, NOW())`,
      [user.id, amount, balanceAfter, `Admin: +${amount} crédits`]
    );

    // Mettre à jour le solde
    await client.query(
      `UPDATE users SET "creditBalance" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [balanceAfter, user.id]
    );

    console.log(`✅ ${amount} crédit(s) ajouté(s) à ${email}`);
    console.log(`   Solde: ${balanceBefore} → ${balanceAfter}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message || error.code || String(error));
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addCredits();
