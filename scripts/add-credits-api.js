#!/usr/bin/env node

/**
 * Script to add credits via API (requires admin token or direct database access)
 * Usage: node scripts/add-credits-api.js <email> <amount>
 * 
 * This script uses the API endpoint /api/v1/credits/add
 * You need to set ADMIN_TOKEN in environment or use Railway's database directly
 */

const https = require('https');
const readline = require('readline');

const API_BASE_URL = process.env.API_BASE_URL || 'https://mascot-production.up.railway.app/api/v1';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // You'll need to set this

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

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email, amount;

  if (args.length >= 2) {
    email = args[0];
    amount = parseInt(args[1]);
  } else {
    email = await getEmail();
    amount = parseInt(await getAmount());
  }

  if (!ADMIN_TOKEN) {
    console.error('\n❌ Error: ADMIN_TOKEN not set');
    console.error('Please set ADMIN_TOKEN environment variable');
    console.error('Or use the database script: node scripts/add-credits.js\n');
    process.exit(1);
  }

  console.log(`\nAdding ${amount} credits to ${email} via API...\n`);

  try {
    // First, we need to get the user ID
    // For now, let's use the database script approach
    console.log('⚠️  API method requires user ID');
    console.log('Please use the database script instead:');
    console.log('  node scripts/add-credits.js <email> <amount>\n');
    process.exit(1);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  rl.close();
}

main().catch(console.error);
