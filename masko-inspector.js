// Script d'inspection pour masko.ai
// Instructions :
// 1. Allez sur https://masko.ai/mascot-generator
// 2. Ouvrez la console (F12 → Console)
// 3. Collez ce script et appuyez sur Entrée
// 4. Générez une animation
// 5. Regardez les logs dans la console

(function() {
  console.log('🔍 Masko.ai Inspector activé !');
  console.log('📝 Générez une animation pour voir les requêtes...\n');

  const capturedRequests = [];
  const capturedResponses = [];

  // Intercepter fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    // Filtrer seulement les requêtes vers masko.ai
    if (typeof url === 'string' && url.includes('masko.ai')) {
      console.log('🔵 FETCH REQUEST:', {
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body
      });
      
      capturedRequests.push({
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        timestamp: new Date().toISOString()
      });

      return originalFetch.apply(this, args).then(response => {
        // Cloner la réponse pour la lire sans la consommer
        response.clone().json().then(data => {
          console.log('🟢 FETCH RESPONSE:', {
            url,
            status: response.status,
            data: data
          });
          
          // Chercher des indices de modèle
          const modelInfo = findModelInfo(data);
          if (modelInfo) {
            console.log('🎯 🎯 🎯 MODÈLE TROUVÉ 🎯 🎯 🎯');
            console.log('Model Info:', modelInfo);
            console.log('Full Response:', data);
          }
          
          capturedResponses.push({
            url,
            status: response.status,
            data: data,
            modelInfo: modelInfo
          });
        }).catch(() => {
          // Pas JSON, essayer texte
          response.clone().text().then(text => {
            console.log('🟢 FETCH RESPONSE (text):', {
              url,
              status: response.status,
              preview: text.substring(0, 200)
            });
          }).catch(() => {});
        });
        
        return response;
      });
    }
    
    return originalFetch.apply(this, args);
  };

  // Intercepter XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    let requestUrl = '';
    let requestMethod = '';
    
    xhr.open = function(method, url, ...args) {
      requestMethod = method;
      requestUrl = url;
      
      if (url.includes('masko.ai')) {
        console.log('🔵 XHR REQUEST:', {
          method,
          url
        });
        
        capturedRequests.push({
          url,
          method,
          timestamp: new Date().toISOString()
        });
      }
      
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    xhr.send = function(...args) {
      if (requestUrl.includes('masko.ai') && args[0]) {
        console.log('🔵 XHR BODY:', args[0]);
      }
      
      xhr.addEventListener('load', function() {
        if (requestUrl.includes('masko.ai')) {
          try {
            const data = JSON.parse(this.responseText);
            console.log('🟢 XHR RESPONSE:', {
              url: requestUrl,
              status: this.status,
              data: data
            });
            
            const modelInfo = findModelInfo(data);
            if (modelInfo) {
              console.log('🎯 🎯 🎯 MODÈLE TROUVÉ 🎯 🎯 🎯');
              console.log('Model Info:', modelInfo);
            }
            
            capturedResponses.push({
              url: requestUrl,
              status: this.status,
              data: data,
              modelInfo: modelInfo
            });
          } catch(e) {
            console.log('🟢 XHR RESPONSE (non-JSON):', {
              url: requestUrl,
              status: this.status,
              preview: this.responseText.substring(0, 200)
            });
          }
        }
      });
      
      return originalSend.apply(this, args);
    };
    
    return xhr;
  };

  // Fonction pour chercher des infos de modèle dans les données
  function findModelInfo(data) {
    if (!data || typeof data !== 'object') return null;
    
    const modelIndicators = [
      'model',
      'provider',
      'engine',
      'ai_model',
      'generation_model',
      'model_name',
      'model_version',
      'service',
      'api_provider'
    ];
    
    const found = {};
    
    // Chercher dans les clés directes
    for (const key of modelIndicators) {
      if (data[key]) {
        found[key] = data[key];
      }
    }
    
    // Chercher récursivement
    function searchRecursive(obj, path = '') {
      if (typeof obj !== 'object' || obj === null) return;
      
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (modelIndicators.some(indicator => 
          key.toLowerCase().includes(indicator.toLowerCase())
        )) {
          found[fullPath] = value;
        }
        
        if (typeof value === 'object') {
          searchRecursive(value, fullPath);
        }
      }
    }
    
    searchRecursive(data);
    
    return Object.keys(found).length > 0 ? found : null;
  }

  // Exposer les données capturées globalement
  window.maskoInspector = {
    requests: capturedRequests,
    responses: capturedResponses,
    getModelInfo: function() {
      const allModelInfo = capturedResponses
        .filter(r => r.modelInfo)
        .map(r => ({
          url: r.url,
          modelInfo: r.modelInfo
        }));
      
      if (allModelInfo.length === 0) {
        console.log('❌ Aucune information de modèle trouvée.');
        console.log('💡 Essayez de générer une animation pour capturer les requêtes.');
        return null;
      }
      
      console.log('📊 Résumé des modèles trouvés:');
      allModelInfo.forEach(info => {
        console.log(`  ${info.url}:`, info.modelInfo);
      });
      
      return allModelInfo;
    },
    exportData: function() {
      const exportData = {
        requests: capturedRequests,
        responses: capturedResponses.map(r => ({
          url: r.url,
          status: r.status,
          modelInfo: r.modelInfo,
          dataPreview: JSON.stringify(r.data).substring(0, 500)
        }))
      };
      
      console.log('📥 Données exportées (copiez ceci):');
      console.log(JSON.stringify(exportData, null, 2));
      
      return exportData;
    },
    clear: function() {
      capturedRequests.length = 0;
      capturedResponses.length = 0;
      console.log('🗑️ Données effacées');
    }
  };

  console.log('\n✅ Inspector prêt !');
  console.log('📋 Commandes disponibles :');
  console.log('  - maskoInspector.getModelInfo() : Voir les modèles trouvés');
  console.log('  - maskoInspector.exportData() : Exporter toutes les données');
  console.log('  - maskoInspector.clear() : Effacer les données capturées');
  console.log('\n🎬 Générez maintenant une animation sur masko.ai !\n');
})();
