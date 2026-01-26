#!/usr/bin/env node

/**
 * Script pour configurer automatiquement les variables Google Cloud dans Railway
 * Usage: node scripts/setup-railway-google-cloud.js [chemin-vers-fichier.json]
 * 
 * Prérequis: Railway CLI installé et authentifié
 *   npm install -g @railway/cli
 *   railway login
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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

function checkRailwayCLI() {
  try {
    execSync('railway --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function main() {
  console.log('🚂 Configuration automatique Railway pour Google Cloud\n');

  // Vérifier Railway CLI
  if (!checkRailwayCLI()) {
    console.log('❌ Railway CLI n\'est pas installé.\n');
    console.log('📋 Installation:');
    console.log('   npm install -g @railway/cli');
    console.log('   railway login\n');
    console.log('💡 Alternative: Utilisez le script encode-google-credentials.js');
    console.log('   pour obtenir les valeurs à copier manuellement dans Railway.\n');
    process.exit(1);
  }

  // Vérifier l'authentification
  try {
    execSync('railway whoami', { stdio: 'ignore' });
  } catch (e) {
    console.log('❌ Vous n\'êtes pas connecté à Railway.\n');
    console.log('📋 Connexion:');
    console.log('   railway login\n');
    process.exit(1);
  }

  let credentialsFile = process.argv[2];

  if (!credentialsFile) {
    console.log('🔍 Recherche de fichiers de credentials Google Cloud...\n');
    const foundFiles = findCredentialsFiles();

    if (foundFiles.length === 0) {
      console.log('❌ Aucun fichier de credentials trouvé.\n');
      console.log('📋 Instructions:');
      console.log('   1. Téléchargez votre fichier JSON depuis Google Cloud Console');
      console.log('   2. Exécutez: node scripts/setup-railway-google-cloud.js /chemin/vers/fichier.json\n');
      process.exit(1);
    } else if (foundFiles.length === 1) {
      credentialsFile = foundFiles[0];
      console.log(`✅ Fichier trouvé: ${credentialsFile}\n`);
    } else {
      console.log('📁 Plusieurs fichiers trouvés:\n');
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
          setupRailway(foundFiles[choice]);
        } else {
          console.log('❌ Choix invalide');
          process.exit(1);
        }
        readline.close();
      });
      return;
    }
  }

  setupRailway(credentialsFile);
}

function setupRailway(credentialsFile) {
  if (!fs.existsSync(credentialsFile)) {
    console.log(`❌ Fichier non trouvé: ${credentialsFile}`);
    process.exit(1);
  }

  console.log(`📄 Lecture du fichier: ${credentialsFile}\n`);

  let credentials;
  try {
    const content = fs.readFileSync(credentialsFile, 'utf8');
    credentials = JSON.parse(content);
  } catch (error) {
    console.log('❌ Erreur lors de la lecture:', error.message);
    process.exit(1);
  }

  const projectId = credentials.project_id;
  const clientEmail = credentials.client_email;
  const base64Encoded = Buffer.from(JSON.stringify(credentials)).toString('base64');

  console.log('📋 Informations détectées:');
  console.log(`   Project ID: ${projectId || 'N/A'}`);
  console.log(`   Client Email: ${clientEmail || 'N/A'}`);
  console.log('');

  // Obtenir le service Railway
  console.log('🔍 Recherche du service backend dans Railway...\n');
  
  let serviceId;
  try {
    // Lister les services
    const servicesOutput = execSync('railway service', { encoding: 'utf8' });
    console.log('Services disponibles:');
    console.log(servicesOutput);
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    readline.question('\nEntrez le nom ou l\'ID du service backend: ', (serviceName) => {
      serviceId = serviceName.trim();
      readline.close();
      
      // Configurer les variables
      console.log('\n🔧 Configuration des variables...\n');
      
      try {
        // GOOGLE_CLOUD_PROJECT_ID
        console.log('   → GOOGLE_CLOUD_PROJECT_ID');
        execSync(`railway variables set GOOGLE_CLOUD_PROJECT_ID="${projectId}" --service ${serviceId}`, { stdio: 'inherit' });
        
        // GOOGLE_CLOUD_CREDENTIALS
        console.log('   → GOOGLE_CLOUD_CREDENTIALS');
        execSync(`railway variables set GOOGLE_CLOUD_CREDENTIALS="${base64Encoded}" --service ${serviceId}`, { stdio: 'inherit' });
        
        // GOOGLE_CLOUD_LOCATION
        console.log('   → GOOGLE_CLOUD_LOCATION');
        execSync(`railway variables set GOOGLE_CLOUD_LOCATION="us-central1" --service ${serviceId}`, { stdio: 'inherit' });
        
        console.log('\n✅ Variables configurées avec succès!');
        console.log('\n🚀 Railway va redéployer automatiquement...');
        console.log('   Vérifiez les logs dans Railway pour confirmer que tout fonctionne.\n');
      } catch (error) {
        console.error('\n❌ Erreur lors de la configuration:', error.message);
        console.log('\n💡 Alternative: Utilisez le script encode-google-credentials.js');
        console.log('   pour obtenir les valeurs à copier manuellement dans Railway.\n');
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Alternative: Utilisez le script encode-google-credentials.js');
    console.log('   pour obtenir les valeurs à copier manuellement dans Railway.\n');
    process.exit(1);
  }
}

main();
