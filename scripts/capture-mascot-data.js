/**
 * Script simple pour capturer et afficher les données MascotAI
 * 
 * INSTRUCTIONS:
 * 1. Collez ce script dans la console
 * 2. Générez un nouveau mascot
 * 3. Les données seront automatiquement affichées et copiées
 */

(function() {
  console.log('🔬 Capture MascotAI activée...\n');
  
  const capturedData = [];
  
  // Intercepter console.log pour capturer les INSERT
  const originalLog = console.log;
  console.log = function(...args) {
    originalLog.apply(console, args);
    
    // Chercher les INSERT received
    if (args.length >= 2) {
      const message = args[0];
      const data = args[1];
      
      if (typeof message === 'string' && message.includes('[Realtime] INSERT received')) {
        if (data && typeof data === 'object') {
          capturedData.push(data);
          
          // Afficher immédiatement
          console.group('📊 DONNÉES CAPTURÉES');
          console.log('Modèle:', data.model);
          
          if (data.config) {
            console.log('Style:', data.config.style);
            console.log('Type:', data.config.type);
            console.log('Personality:', data.config.personality);
            console.log('Prompt:', data.config.prompt || data.config.text || data.config.input || data.config.description);
            console.log('Accessories:', data.config.accessories);
            console.log('Brand Colors:', data.config.brandColors);
            console.log('Negative Prompt:', data.config.negativePrompt);
            console.log('Advanced Mode:', data.config.advancedMode);
            console.log('Num Variations:', data.config.numVariations);
            console.log('\n📋 Config complète:', data.config);
          }
          
          console.log('\n📦 Objet complet:', data);
          console.groupEnd();
          
          // Copier automatiquement (avec gestion d'erreur)
          try {
            const json = JSON.stringify(data, null, 2);
            navigator.clipboard.writeText(json).then(() => {
              console.log('✅ Données copiées dans le presse-papiers !');
            }).catch(() => {
              console.log('⚠️ Impossible de copier automatiquement. Utilisez: copyMascotData()');
            });
          } catch (e) {
            console.log('⚠️ Erreur lors de la copie:', e.message);
          }
        }
      }
    }
  };
  
  // Fonction pour afficher toutes les données capturées
  window.showAllCaptured = function() {
    if (capturedData.length === 0) {
      console.log('❌ Aucune donnée capturée. Générez un mascot d\'abord.');
      return;
    }
    
    console.group('📊 TOUTES LES DONNÉES CAPTURÉES (' + capturedData.length + ')');
    capturedData.forEach((data, index) => {
      console.group(`Mascot ${index + 1}`);
      console.log('Modèle:', data.model);
      if (data.config) {
        console.log('Style:', data.config.style);
        console.log('Type:', data.config.type);
        console.log('Personality:', data.config.personality);
        console.log('Prompt:', data.config.prompt || data.config.text || data.config.input || data.config.description);
        console.log('Accessories:', data.config.accessories);
        console.log('Brand Colors:', data.config.brandColors);
        console.log('Negative Prompt:', data.config.negativePrompt);
        console.log('Config complète:', data.config);
      }
      console.log('Objet complet:', data);
      console.groupEnd();
    });
    console.groupEnd();
  };
  
  // Fonction pour copier toutes les données
  window.copyMascotData = function() {
    if (capturedData.length === 0) {
      console.log('❌ Aucune donnée à copier. Générez un mascot d\'abord.');
      return;
    }
    
    const json = JSON.stringify(capturedData, null, 2);
    
    // Méthode 1: Clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        console.log('✅ Données copiées dans le presse-papiers !');
        console.log('📋 Collez-les dans le chat pour que je puisse les analyser.');
      }).catch(() => {
        // Méthode 2: Fallback
        console.log('⚠️ Clipboard API échoué. Utilisation de la méthode alternative...');
        const textarea = document.createElement('textarea');
        textarea.value = json;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          console.log('✅ Données copiées !');
          console.log('📋 Collez-les dans le chat.');
        } catch (e) {
          console.log('❌ Impossible de copier. Voici les données:');
          console.log(json);
        }
        document.body.removeChild(textarea);
      });
    } else {
      console.log('❌ Clipboard API non disponible. Voici les données:');
      console.log(json);
    }
  };
  
  console.log('✅ Capture activée !');
  console.log('\n📋 INSTRUCTIONS:');
  console.log('   1. Générez un nouveau mascot sur le site');
  console.log('   2. Les données seront automatiquement affichées');
  console.log('   3. Pour voir toutes les données: showAllCaptured()');
  console.log('   4. Pour copier toutes les données: copyMascotData()');
  console.log('\n💡 Astuce: Cliquez sur la page avant de générer pour éviter les erreurs de clipboard.\n');
})();
