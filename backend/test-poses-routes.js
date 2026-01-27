// Script de test pour vérifier les routes poses
// Usage: node test-poses-routes.js

const http = require('http');

const API_BASE = process.env.API_URL || 'http://localhost:3000/api/v1';
const MASCOT_ID = process.argv[2] || 'test-mascot-id';

console.log('🧪 Test des routes Poses');
console.log('API Base:', API_BASE);
console.log('Mascot ID:', MASCOT_ID);
console.log('');

// Test 1: GET /mascots/:id/poses
console.log('1️⃣ Test GET /mascots/:id/poses');
const getOptions = {
  hostname: API_BASE.replace('http://', '').replace('https://', '').split('/')[0],
  port: API_BASE.includes('https') ? 443 : (API_BASE.includes('localhost') ? 3000 : 80),
  path: `/api/v1/mascots/${MASCOT_ID}/poses`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const getReq = http.request(getOptions, (res) => {
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Headers:`, res.headers);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`   Response: ${data.substring(0, 200)}`);
    console.log('');
    
    if (res.statusCode === 404) {
      console.log('❌ Route non trouvée - Le backend n\'a probablement pas été redéployé');
    } else if (res.statusCode === 401) {
      console.log('⚠️  Route trouvée mais authentification requise (normal)');
    } else {
      console.log('✅ Route accessible');
    }
  });
});

getReq.on('error', (e) => {
  console.error(`   ❌ Erreur: ${e.message}`);
});

getReq.end();
