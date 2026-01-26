/**
 * Script de test pour vérifier les credentials Google Cloud
 * Usage: node scripts/test-google-credentials.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function testCredentials() {
  console.log('🔍 Testing Google Cloud credentials...\n');

  // Check environment variables
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const credentialsBase64 = process.env.GOOGLE_CLOUD_CREDENTIALS;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  console.log('📋 Environment variables:');
  console.log(`  GOOGLE_CLOUD_PROJECT_ID: ${projectId || '❌ NOT SET'}`);
  console.log(`  GOOGLE_CLOUD_CREDENTIALS: ${credentialsBase64 ? `✅ SET (${credentialsBase64.length} chars)` : '❌ NOT SET'}`);
  console.log(`  GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPath || '❌ NOT SET'}`);
  console.log(`  GOOGLE_CLOUD_LOCATION: ${location}`);
  console.log('');

  if (!projectId) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID is required!');
    process.exit(1);
  }

  if (!credentialsBase64 && !credentialsPath) {
    console.error('❌ Either GOOGLE_CLOUD_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS must be set!');
    process.exit(1);
  }

  // Try to decode credentials
  let credentials = null;
  if (credentialsBase64) {
    try {
      console.log('🔓 Decoding base64 credentials...');
      const decoded = Buffer.from(credentialsBase64, 'base64').toString();
      credentials = JSON.parse(decoded);
      console.log('✅ Credentials decoded successfully');
      console.log(`  Client email: ${credentials.client_email || 'N/A'}`);
      console.log(`  Project ID: ${credentials.project_id || 'N/A'}`);
      console.log(`  Private key present: ${!!credentials.private_key}`);
      console.log('');
    } catch (error) {
      console.error('❌ Failed to decode credentials:', error.message);
      console.error('   Make sure GOOGLE_CLOUD_CREDENTIALS is valid base64-encoded JSON');
      process.exit(1);
    }
  }

  // Try to initialize VertexAI
  try {
    console.log('🚀 Initializing VertexAI...');
    const { VertexAI } = require('@google-cloud/vertexai');
    
    const config = {
      project: projectId,
      location: location,
    };

    if (credentialsPath) {
      config.keyFilename = credentialsPath;
      console.log(`  Using credentials from file: ${credentialsPath}`);
    } else if (credentials) {
      config.credentials = credentials;
      console.log(`  Using credentials from environment variable`);
    }

    const vertexAI = new VertexAI(config);
    console.log('✅ VertexAI initialized successfully');
    console.log('');

    // Try to make a test request
    console.log('🧪 Testing API connection...');
    const model = vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    // Simple test request
    const testRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'A simple red circle',
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    console.log('  Sending test request...');
    const response = await model.generateContent(testRequest);
    console.log('✅ API connection successful!');
    console.log('   Response received (this is a good sign)');
    console.log('');

    console.log('🎉 All tests passed! Your Google Cloud credentials are correctly configured.');
  } catch (error) {
    console.error('❌ Failed to initialize or test VertexAI:');
    console.error(`   Error type: ${error.constructor?.name || 'Unknown'}`);
    console.error(`   Error message: ${error.message}`);
    
    if (error.message.includes('Unable to authenticate')) {
      console.error('');
      console.error('💡 Possible solutions:');
      console.error('   1. Verify that GOOGLE_CLOUD_CREDENTIALS is correctly base64-encoded');
      console.error('   2. Check that the service account has "Vertex AI User" role');
      console.error('   3. Ensure Vertex AI API is enabled in your Google Cloud project');
      console.error('   4. Verify that GOOGLE_CLOUD_PROJECT_ID matches the project_id in credentials');
    }
    
    if (error.stack) {
      console.error('');
      console.error('   Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

testCredentials().catch(console.error);
