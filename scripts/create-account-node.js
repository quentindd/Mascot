#!/usr/bin/env node

// Script Node.js pour créer un compte sur Railway
// Usage: node scripts/create-account-node.js

const https = require('https');

const RAILWAY_URL = 'https://mascot-production.up.railway.app';
const API_URL = `${RAILWAY_URL}/api/v1`;

// Générer un email unique
const timestamp = Date.now();
const email = `test-${timestamp}@mascot.app`;
const password = 'TestMascot123!';

const data = JSON.stringify({
  email: email,
  password: password,
  name: `Test User ${timestamp}`
});

const options = {
  hostname: 'mascot-production.up.railway.app',
  port: 443,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  timeout: 10000
};

console.log('🔐 Création d\'un compte en production...');
console.log('');
console.log(`URL API: ${API_URL}`);
console.log(`📧 Email: ${email}`);
console.log(`🔑 Password: ${password}`);
console.log('');
console.log('⏳ Envoi de la requête...');
console.log('');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`📋 Réponse (HTTP ${res.statusCode}):`);
    
    try {
      const json = JSON.parse(responseData);
      console.log(JSON.stringify(json, null, 2));
      console.log('');

      if (json.accessToken) {
        const token = json.accessToken;
        
        console.log('✅ Compte créé avec succès !');
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔑 TOKEN API (copiez-le dans le plugin Figma)');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log(token);
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('📋 Informations du compte:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('   Crédits: 1 (gratuit)');
        console.log('');
        console.log('💡 Collez ce token dans le plugin Figma !');
        console.log('');

        // Sauvegarder dans un fichier
        const fs = require('fs');
        fs.writeFileSync('TOKEN_PRODUCTION_ACTUEL.txt', token, 'utf-8');
        console.log('📄 Token sauvegardé dans: TOKEN_PRODUCTION_ACTUEL.txt');
        console.log('');
      } else {
        console.log('❌ Erreur: Token non trouvé dans la réponse');
        console.log('');
        console.log('Vérifiez:');
        console.log('  1. Le backend est-il correctement déployé ?');
        console.log('  2. L\'endpoint /auth/register existe-t-il ?');
        console.log('  3. Y a-t-il des erreurs dans les logs Railway ?');
        process.exit(1);
      }
    } catch (e) {
      console.log('❌ Erreur lors du parsing de la réponse:');
      console.log(responseData);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Erreur de connexion:');
  console.log(error.message);
  console.log('');
  console.log('Vérifiez que:');
  console.log('  1. Le service Railway est déployé');
  console.log('  2. L\'URL est correcte');
  console.log('  3. Le service est accessible depuis votre navigateur');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Timeout: Le serveur ne répond pas');
  req.destroy();
  process.exit(1);
});

req.write(data);
req.end();
