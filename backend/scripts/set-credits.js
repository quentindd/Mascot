#!/usr/bin/env node

/**
 * Script pour définir le solde de crédits d'un utilisateur.
 * Usage: cd backend && DATABASE_URL="..." node scripts/set-credits.js dimpre.quentin@gmail.com 100
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const email = process.argv[2] || 'dimpre.quentin@gmail.com';
const targetBalance = parseInt(process.argv[3] || '100', 10);

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

async function setCredits() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL manquant');
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
    const delta = targetBalance - balanceBefore;

    await client.query(
      `INSERT INTO credit_ledger ("userId", type, amount, "balanceAfter", status, description, "createdAt")
       VALUES ($1, 'admin_adjustment', $2, $3, 'completed', $4, NOW())`,
      [user.id, delta, targetBalance, `Admin: solde défini à ${targetBalance}`]
    );

    await client.query(
      `UPDATE users SET "creditBalance" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [targetBalance, user.id]
    );

    console.log(`✅ Solde défini à ${targetBalance} crédits pour ${email}`);
    console.log(`   Avant: ${balanceBefore} → Après: ${targetBalance}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setCredits();
