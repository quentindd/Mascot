#!/usr/bin/env node

/**
 * Script to add credits to a user account
 * Usage: node scripts/add-credits.js <email> <amount>
 * Example: node scripts/add-credits.js user@example.com 100
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getEmail() {
  return new Promise((resolve) => {
    rl.question('Enter user email: ', (email) => {
      resolve(email.trim());
    });
  });
}

async function getAmount() {
  return new Promise((resolve) => {
    rl.question('Enter amount of credits to add (default: 100): ', (amount) => {
      resolve(amount.trim() || '100');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email, amount;

  if (args.length >= 2) {
    email = args[0];
    amount = args[1];
  } else {
    email = await getEmail();
    amount = await getAmount();
  }

  console.log(`\nAdding ${amount} credits to ${email}...\n`);

  // Read database config from .env
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../backend/.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('Error: backend/.env file not found');
    console.error('Please create it with DATABASE_URL');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
  
  if (!dbUrlMatch) {
    console.error('Error: DATABASE_URL not found in backend/.env');
    process.exit(1);
  }

  const databaseUrl = dbUrlMatch[1].trim();

  // Use psql to update credits
  try {
    // First, get user ID from email
    const getUserQuery = `SELECT id, email, "creditBalance" FROM users WHERE email = '${email.replace(/'/g, "''")}';`;
    
    console.log('Connecting to database...');
    const userResult = execSync(
      `psql "${databaseUrl}" -t -c "${getUserQuery}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();

    if (!userResult || !userResult.includes('|')) {
      console.error(`Error: User with email ${email} not found`);
      process.exit(1);
    }

    const [userId, userEmail, currentBalance] = userResult.split('|').map(s => s.trim());
    
    console.log(`Found user: ${userEmail}`);
    console.log(`Current balance: ${currentBalance} credits`);
    
    const newBalance = parseInt(currentBalance) + parseInt(amount);
    
    // Update credit balance
    const updateQuery = `UPDATE users SET "creditBalance" = ${newBalance} WHERE id = '${userId}';`;
    
    execSync(
      `psql "${databaseUrl}" -c "${updateQuery}"`,
      { encoding: 'utf-8', stdio: 'inherit' }
    );
    
    // Create ledger entry
    const ledgerQuery = `
      INSERT INTO credit_ledger ("userId", type, amount, "balanceAfter", status, description, "createdAt", "updatedAt")
      VALUES (
        '${userId}',
        'MANUAL',
        ${amount},
        ${newBalance},
        'COMPLETED',
        'Manual credit addition via script',
        NOW(),
        NOW()
      );
    `;
    
    execSync(
      `psql "${databaseUrl}" -c "${ledgerQuery}"`,
      { encoding: 'utf-8', stdio: 'inherit' }
    );
    
    console.log(`\n✅ Successfully added ${amount} credits!`);
    console.log(`New balance: ${newBalance} credits\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('psql: command not found')) {
      console.error('\nError: psql command not found');
      console.error('Please install PostgreSQL client tools or use Docker:');
      console.error('  docker exec -it <postgres-container> psql -U <user> -d <database>');
    }
    process.exit(1);
  }

  rl.close();
}

main().catch(console.error);
