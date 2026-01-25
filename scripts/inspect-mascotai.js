/**
 * Script pour inspecter MascotAI.app et identifier les modèles/prompts
 * 
 * Usage:
 * 1. Ouvrez https://mascotai.app/create dans Chrome
 * 2. Ouvrez DevTools (F12)
 * 3. Collez ce script dans la Console
 * 4. Générez un mascot
 * 5. Regardez les logs dans la console
 */

(function() {
  console.log('🔍 MascotAI Inspector activé');
  
  // 1. Intercepter fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    // Log toutes les requêtes API
    if (url.includes('/api/') || url.includes('/v1/') || url.includes('generate')) {
      console.group('🌐 API Request');
      console.log('URL:', url);
      console.log('Method:', options.method || 'GET');
      
      if (options.body) {
        try {
          const body = typeof options.body === 'string' 
            ? JSON.parse(options.body) 
            : options.body;
          console.log('Body:', body);
          
          // Chercher des indices de modèle
          if (body.model) {
            console.log('🎯 MODÈLE DÉTECTÉ:', body.model);
          }
          if (body.prompt) {
            console.log('📝 PROMPT:', body.prompt);
          }
          if (body.style) {
            console.log('🎨 STYLE:', body.style);
          }
        } catch (e) {
          console.log('Body (raw):', options.body);
        }
      }
      console.groupEnd();
    }
    
    return originalFetch.apply(this, args).then(response => {
      // Log les réponses
      if (url.includes('/api/') || url.includes('/v1/') || url.includes('generate')) {
        response.clone().json().then(data => {
          console.group('📥 API Response');
          console.log('URL:', url);
          console.log('Data:', data);
          
          // Chercher des métadonnées
          if (data.metadata) {
            console.log('📊 MÉTADONNÉES:', data.metadata);
          }
          if (data.model) {
            console.log('🎯 MODÈLE:', data.model);
          }
          console.groupEnd();
        }).catch(() => {});
      }
      return response;
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
    if (this._url && (this._url.includes('/api/') || this._url.includes('/v1/'))) {
      console.group('🌐 XHR Request');
      console.log('URL:', this._url);
      console.log('Method:', this._method);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log('Body:', parsed);
          if (parsed.model) console.log('🎯 MODÈLE:', parsed.model);
          if (parsed.prompt) console.log('📝 PROMPT:', parsed.prompt);
        } catch (e) {
          console.log('Body (raw):', data);
        }
      }
      console.groupEnd();
    }
    
    this.addEventListener('load', function() {
      if (this._url && (this._url.includes('/api/') || this._url.includes('/v1/'))) {
        try {
          const response = JSON.parse(this.responseText);
          console.group('📥 XHR Response');
          console.log('URL:', this._url);
          console.log('Data:', response);
          if (response.metadata) console.log('📊 MÉTADONNÉES:', response.metadata);
          console.groupEnd();
        } catch (e) {}
      }
    });
    
    return originalXHRSend.apply(this, [data]);
  };
  
  // 3. Analyser les scripts chargés
  console.log('📜 Scripts chargés:');
  Array.from(document.scripts).forEach((script, i) => {
    if (script.src) {
      console.log(`${i + 1}. ${script.src}`);
      // Chercher des indices dans les URLs
      if (script.src.includes('vertex') || script.src.includes('google')) {
        console.log('   🎯 Indice: Google Cloud / Vertex AI');
      }
      if (script.src.includes('openai') || script.src.includes('dalle')) {
        console.log('   🎯 Indice: OpenAI / DALL-E');
      }
      if (script.src.includes('replicate')) {
        console.log('   🎯 Indice: Replicate');
      }
      if (script.src.includes('stability') || script.src.includes('sdxl')) {
        console.log('   🎯 Indice: Stability AI / SDXL');
      }
    }
  });
  
  // 4. Chercher des variables globales
  console.log('🔍 Variables globales:');
  const globalVars = ['__MODEL__', '__API_KEY__', '__PROMPT_TEMPLATE__', 'model', 'apiKey'];
  globalVars.forEach(varName => {
    if (window[varName]) {
      console.log(`   ${varName}:`, window[varName]);
    }
  });
  
  // 5. Analyser les WebSockets (si utilisés)
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(...args) {
    console.log('🔌 WebSocket connecté:', args[0]);
    return new originalWebSocket(...args);
  };
  
  console.log('✅ Inspector prêt ! Générez un mascot pour voir les logs.');
  console.log('💡 Astuce: Regardez l\'onglet Network dans DevTools pour plus de détails.');
})();
