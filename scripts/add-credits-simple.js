#!/usr/bin/env node

/**
 * Script simple pour ajouter des crédits via l'API
 * Usage: node scripts/add-credits-simple.js <token> <amount>
 * 
 * Le token est votre accessToken (celui que vous utilisez dans le plugin Figma)
 */

const https = require('https');

const API_BASE_URL = 'https://mascot-production.up.railway.app/api/v1';

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

async function addCredits(token, amount) {
  const url = new URL(`${API_BASE_URL}/credits/add`);
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const data = {
    amount: parseInt(amount),
    description: `Added ${amount} credits via script`,
  };

  console.log(`\nAdding ${amount} credits...\n`);

  try {
    const response = await makeRequest(url, options, data);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Success!', response.data);
      console.log(`\nAdded ${amount} credits to your account.\n`);
    } else {
      console.error('❌ Error:', response.status);
      console.error('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/add-credits-simple.js <token> <amount>');
  console.log('\nExample:');
  console.log('  node scripts/add-credits-simple.js eyJhbGciOiJIUzI1NiIs... 100');
  console.log('\nTo get your token:');
  console.log('  1. Open Figma plugin');
  console.log('  2. Check browser console for the token');
  console.log('  3. Or use the token from your login response\n');
  process.exit(1);
}

const [token, amount] = args;
addCredits(token, amount);
