#!/usr/bin/env node

/**
 * Script pour vérifier que les credentials base64 sont valides
 */

const fs = require('fs');
const path = require('path');

const credentialsFile = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'mascot-485416-2ec0bdd72cde.json');

if (!fs.existsSync(credentialsFile)) {
  console.error('❌ Fichier non trouvé:', credentialsFile);
  process.exit(1);
}

console.log('📄 Lecture du fichier:', credentialsFile);
const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));

console.log('✅ JSON valide');
console.log('   Project ID:', credentials.project_id);
console.log('   Client Email:', credentials.client_email);

// Encoder en base64
const base64Encoded = Buffer.from(JSON.stringify(credentials)).toString('base64');

console.log('\n📏 Taille de la chaîne base64:', base64Encoded.length, 'caractères');

// Vérifier que le décodage fonctionne
try {
  const decoded = Buffer.from(base64Encoded, 'base64').toString();
  const parsed = JSON.parse(decoded);
  console.log('✅ Décodage et parsing réussis');
  console.log('   Project ID décodé:', parsed.project_id);
  console.log('   Client Email décodé:', parsed.client_email);
  
  // Vérifier que c'est identique
  if (JSON.stringify(credentials) === JSON.stringify(parsed)) {
    console.log('\n✅ Les credentials sont valides et peuvent être utilisés !');
    console.log('\n📋 Variable à copier dans Railway:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('GOOGLE_CLOUD_CREDENTIALS=' + base64Encoded);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Copiez TOUTE la chaîne (très longue)');
    console.log('   - Pas d\'espaces ou retours à la ligne');
    console.log('   - Collez directement dans Railway sans modification');
  } else {
    console.error('❌ Les credentials décodés ne correspondent pas !');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur lors du décodage:', error.message);
  process.exit(1);
}
