#!/usr/bin/env node

/**
 * Script pour encoder les credentials Google Cloud en base64
 * Usage: node scripts/encode-google-credentials.js [chemin-vers-fichier.json]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function findCredentialsFiles() {
  const possiblePaths = [
    path.join(os.homedir(), 'Downloads'),
    path.join(os.homedir(), 'Desktop'),
    process.cwd(),
    path.join(process.cwd(), 'backend'),
  ];

  const foundFiles = [];

  for (const basePath of possiblePaths) {
    if (!fs.existsSync(basePath)) continue;

    try {
      const files = fs.readdirSync(basePath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(basePath, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('"type": "service_account"')) {
              foundFiles.push(filePath);
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  return foundFiles;
}

function main() {
  let credentialsFile = process.argv[2];

  if (!credentialsFile) {
    console.log('🔍 Recherche de fichiers de credentials Google Cloud...\n');
    const foundFiles = findCredentialsFiles();

    if (foundFiles.length === 0) {
      console.log('❌ Aucun fichier de credentials trouvé.\n');
      console.log('📋 Instructions:');
      console.log('   1. Téléchargez votre fichier JSON depuis Google Cloud Console');
      console.log('   2. Exécutez: node scripts/encode-google-credentials.js /chemin/vers/votre-fichier.json\n');
      process.exit(1);
    } else if (foundFiles.length === 1) {
      credentialsFile = foundFiles[0];
      console.log(`✅ Fichier trouvé: ${credentialsFile}\n`);
    } else {
      console.log('📁 Plusieurs fichiers de credentials trouvés:\n');
      foundFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      console.log('');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      readline.question(`Choisissez un numéro (1-${foundFiles.length}): `, (answer) => {
        const choice = parseInt(answer) - 1;
        if (choice >= 0 && choice < foundFiles.length) {
          processCredentials(foundFiles[choice]);
        } else {
          console.log('❌ Choix invalide');
          process.exit(1);
        }
        readline.close();
      });
      return;
    }
  }

  processCredentials(credentialsFile);
}

function processCredentials(credentialsFile) {
  if (!fs.existsSync(credentialsFile)) {
    console.log(`❌ Fichier non trouvé: ${credentialsFile}`);
    process.exit(1);
  }

  console.log(`📄 Fichier sélectionné: ${credentialsFile}\n`);

  let credentials;
  try {
    const content = fs.readFileSync(credentialsFile, 'utf8');
    credentials = JSON.parse(content);
  } catch (error) {
    console.log('❌ Erreur lors de la lecture du fichier:', error.message);
    process.exit(1);
  }

  if (credentials.type !== 'service_account') {
    console.log('⚠️  Attention: Ce fichier ne semble pas être un fichier de credentials Google Cloud valide.');
    console.log('   Type trouvé:', credentials.type);
  }

  const projectId = credentials.project_id;
  const clientEmail = credentials.client_email;

  console.log('📋 Informations du fichier:');
  console.log(`   Project ID: ${projectId || 'N/A'}`);
  console.log(`   Client Email: ${clientEmail || 'N/A'}`);
  console.log('');

  // Encoder en base64
  console.log('🔐 Encodage en base64...');
  const base64Encoded = Buffer.from(JSON.stringify(credentials)).toString('base64');

  console.log('✅ Encodage réussi!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Variables à ajouter dans Railway:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`GOOGLE_CLOUD_PROJECT_ID=${projectId || 'your-project-id'}`);
  console.log('');
  console.log(`GOOGLE_CLOUD_CREDENTIALS=${base64Encoded}`);
  console.log('');
  console.log('GOOGLE_CLOUD_LOCATION=us-central1');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('💡 Copiez ces valeurs et ajoutez-les dans Railway → Variables');
  console.log('');

  // Optionnel: sauvegarder dans un fichier
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question('💾 Sauvegarder dans un fichier .env.local? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      const envFile = path.join(process.cwd(), 'backend', '.env.local');
      const envContent = `# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=${projectId || 'your-project-id'}
GOOGLE_CLOUD_CREDENTIALS=${base64Encoded}
GOOGLE_CLOUD_LOCATION=us-central1
`;
      fs.appendFileSync(envFile, envContent);
      console.log(`✅ Variables sauvegardées dans ${envFile}`);
    }
    readline.close();
  });
}

main();
