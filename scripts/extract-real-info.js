/**
 * Script d'extraction d'informations RÉELLES depuis MascotAI.app
 * 
 * INSTRUCTIONS:
 * 1. Ouvrez https://mascotai.app/create dans Chrome
 * 2. F12 → Console
 * 3. Collez ce script
 * 4. Générez un mascot
 * 5. Les informations réelles seront affichées
 */

(function() {
  console.log('🔬 Extraction d\'informations RÉELLES activée...\n');
  
  const results = {
    apiEndpoints: [],
    requestBodies: [],
    responseBodies: [],
    headers: [],
    models: [],
    prompts: [],
    errors: []
  };
  
  // 1. Intercepter TOUTES les requêtes fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    // Capturer TOUTES les requêtes (pas seulement /api/)
    const requestData = {
      url: url.toString(),
      method: options.method || 'GET',
      headers: options.headers || {},
      timestamp: new Date().toISOString()
    };
    
    if (options.body) {
      try {
        requestData.body = typeof options.body === 'string' 
          ? JSON.parse(options.body) 
          : options.body;
        
        // Extraire le modèle si présent
        if (requestData.body.model) {
          results.models.push({
            source: 'request',
            value: requestData.body.model,
            url: url.toString()
          });
        }
        
        // Extraire le prompt si présent
        if (requestData.body.prompt) {
          results.prompts.push({
            source: 'request',
            value: requestData.body.prompt,
            url: url.toString()
          });
        }
        
        // Extraire tous les champs
        if (requestData.body) {
          results.requestBodies.push({
            url: url.toString(),
            data: requestData.body
          });
        }
      } catch (e) {
        requestData.bodyRaw = options.body.toString();
      }
    }
    
    results.apiEndpoints.push(requestData);
    
    return originalFetch.apply(this, args).then(response => {
      // Capturer la réponse
      const responseClone = response.clone();
      
      responseClone.text().then(text => {
        try {
          const jsonData = JSON.parse(text);
          
          results.responseBodies.push({
            url: url.toString(),
            data: jsonData
          });
          
          // Chercher le modèle dans la réponse
          if (jsonData.model) {
            results.models.push({
              source: 'response',
              value: jsonData.model,
              url: url.toString()
            });
          }
          
          // Chercher dans metadata
          if (jsonData.metadata) {
            if (jsonData.metadata.model) {
              results.models.push({
                source: 'metadata',
                value: jsonData.metadata.model,
                url: url.toString()
              });
            }
            if (jsonData.metadata.prompt) {
              results.prompts.push({
                source: 'metadata',
                value: jsonData.metadata.prompt,
                url: url.toString()
              });
            }
          }
          
          // Chercher récursivement
          function searchForModel(obj, path = '') {
            if (typeof obj !== 'object' || obj === null) return;
            
            for (const [key, value] of Object.entries(obj)) {
              const currentPath = path ? `${path}.${key}` : key;
              
              if (key.toLowerCase().includes('model') && typeof value === 'string') {
                results.models.push({
                  source: 'deep_search',
                  value: value,
                  path: currentPath,
                  url: url.toString()
                });
              }
              
              if (key.toLowerCase().includes('prompt') && typeof value === 'string') {
                results.prompts.push({
                  source: 'deep_search',
                  value: value,
                  path: currentPath,
                  url: url.toString()
                });
              }
              
              if (typeof value === 'object') {
                searchForModel(value, currentPath);
              }
            }
          }
          
          searchForModel(jsonData);
          
        } catch (e) {
          // Pas du JSON, peut-être du texte
          if (text.length < 1000) {
            results.responseBodies.push({
              url: url.toString(),
              data: text
            });
          }
        }
      }).catch(() => {});
      
      return response;
    }).catch(error => {
      results.errors.push({
        url: url.toString(),
        error: error.message
      });
      throw error;
    });
  };
  
  // 2. Intercepter XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(data) {
    const requestData = {
      url: this._url,
      method: this._method,
      timestamp: new Date().toISOString()
    };
    
    if (data) {
      try {
        requestData.body = JSON.parse(data);
        if (requestData.body.model) {
          results.models.push({
            source: 'xhr_request',
            value: requestData.body.model,
            url: this._url
          });
        }
        if (requestData.body.prompt) {
          results.prompts.push({
            source: 'xhr_request',
            value: requestData.body.prompt,
            url: this._url
          });
        }
      } catch (e) {
        requestData.bodyRaw = data.toString();
      }
    }
    
    results.apiEndpoints.push(requestData);
    
    this.addEventListener('load', function() {
      try {
        const response = JSON.parse(this.responseText);
        results.responseBodies.push({
          url: this._url,
          data: response
        });
        
        // Recherche récursive
        function searchForModel(obj, path = '') {
          if (typeof obj !== 'object' || obj === null) return;
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            if (key.toLowerCase().includes('model') && typeof value === 'string') {
              results.models.push({
                source: 'xhr_response',
                value: value,
                path: currentPath,
                url: this._url
              });
            }
            if (typeof value === 'object') {
              searchForModel(value, currentPath);
            }
          }
        }
        searchForModel(response);
      } catch (e) {}
    });
    
    return originalXHRSend.apply(this, [data]);
  };
  
  // 3. Analyser les scripts et variables globales
  function analyzeScripts() {
    console.log('📜 Analyse des scripts...');
    
    Array.from(document.scripts).forEach(script => {
      if (script.src) {
        // Chercher des patterns dans les URLs
        const url = script.src.toLowerCase();
        if (url.includes('vertex') || url.includes('google-cloud')) {
          results.models.push({
            source: 'script_url',
            value: 'Google Vertex AI (Imagen)',
            url: script.src
          });
        }
        if (url.includes('openai') || url.includes('dalle')) {
          results.models.push({
            source: 'script_url',
            value: 'OpenAI (DALL-E)',
            url: script.src
          });
        }
        if (url.includes('replicate')) {
          results.models.push({
            source: 'script_url',
            value: 'Replicate',
            url: script.src
          });
        }
        if (url.includes('stability') || url.includes('sdxl')) {
          results.models.push({
            source: 'script_url',
            value: 'Stability AI (SDXL)',
            url: script.src
          });
        }
      }
    });
    
    // Chercher dans window
    const suspiciousKeys = [
      'model', 'apiModel', 'generationModel', 'aiModel',
      'vertex', 'openai', 'replicate', 'stability',
      'promptTemplate', 'promptBuilder'
    ];
    
    suspiciousKeys.forEach(key => {
      if (window[key]) {
        results.models.push({
          source: 'window_variable',
          value: window[key],
          key: key
        });
      }
    });
  }
  
  // 4. Fonction pour afficher les résultats
  window.showMascotAIResults = function() {
    console.clear();
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RÉSULTATS D\'EXTRACTION - MascotAI.app');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (results.models.length > 0) {
      console.log('🎯 MODÈLES DÉTECTÉS (100% CERTAINS):');
      console.log('─────────────────────────────────────────────────────');
      results.models.forEach((m, i) => {
        console.log(`${i + 1}. ${m.value}`);
        console.log(`   Source: ${m.source}`);
        if (m.url) console.log(`   URL: ${m.url}`);
        if (m.path) console.log(`   Path: ${m.path}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Aucun modèle détecté dans les requêtes');
      console.log('   → Les modèles sont probablement côté serveur');
    }
    
    if (results.prompts.length > 0) {
      console.log('📝 PROMPTS DÉTECTÉS (100% CERTAINS):');
      console.log('─────────────────────────────────────────────────────');
      results.prompts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.value.substring(0, 200)}...`);
        console.log(`   Source: ${p.source}`);
        if (p.url) console.log(`   URL: ${p.url}`);
        console.log('');
      });
    }
    
    if (results.apiEndpoints.length > 0) {
      console.log('🌐 ENDPOINTS API DÉTECTÉS:');
      console.log('─────────────────────────────────────────────────────');
      const uniqueEndpoints = [...new Set(results.apiEndpoints.map(e => e.url))];
      uniqueEndpoints.forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
      });
      console.log('');
    }
    
    if (results.requestBodies.length > 0) {
      console.log('📤 CORPS DES REQUÊTES (exemples):');
      console.log('─────────────────────────────────────────────────────');
      results.requestBodies.slice(0, 3).forEach((req, i) => {
        console.log(`\nRequête ${i + 1} (${req.url}):`);
        console.log(JSON.stringify(req.data, null, 2));
      });
    }
    
    // Export JSON
    console.log('\n💾 Pour exporter en JSON:');
    console.log('   copy(JSON.stringify(window.mascotAIResults, null, 2))');
    
    window.mascotAIResults = results;
  };
  
  // 5. Auto-analyse au chargement
  analyzeScripts();
  
  // 6. Surveiller les changements
  const observer = new MutationObserver(() => {
    analyzeScripts();
  });
  observer.observe(document, { childList: true, subtree: true });
  
  console.log('✅ Script d\'extraction activé !');
  console.log('\n📋 INSTRUCTIONS:');
  console.log('   1. Générez un mascot sur le site');
  console.log('   2. Tapez: showMascotAIResults()');
  console.log('   3. Les informations RÉELLES seront affichées\n');
  
  // Afficher automatiquement après 10 secondes
  setTimeout(() => {
    console.log('⏰ Affichage automatique des résultats...\n');
    showMascotAIResults();
  }, 10000);
})();
