# Analyser les exemples publics de masko.ai

## Solution sans crédits : Analyser les exemples publics

Masko.ai a des exemples publics avec des animations déjà générées. On peut les analyser directement !

## Méthode 1 : Inspecter les vidéos des exemples

### Étape 1 : Aller sur une page d'exemple

1. Allez sur : https://masko.ai/examples/fitness-app-mascot
2. Ouvrez les DevTools (F12)
3. Allez dans l'onglet **Network**
4. Filtrez par **Media** ou **Video**
5. Cliquez sur une animation pour la voir
6. **Observez les requêtes vidéo qui apparaissent**

### Étape 2 : Analyser les URLs des vidéos

Les vidéos seront chargées avec des URLs comme :
- `https://cdn.masko.ai/animations/xxx.webm`
- `https://cdn.masko.ai/animations/xxx.mov`

### Étape 3 : Analyser les métadonnées

Utilisez ces outils en ligne pour analyser les vidéos :

1. **Probe.video** : https://probe.video/
   - Collez l'URL de la vidéo
   - Cliquez sur "Analyze"
   - Vous verrez : codec, bitrate, fps, durée, etc.

2. **FFprobe en ligne** : 
   ```bash
   # Si vous avez ffmpeg installé localement
   ffprobe -v error -show_format -show_streams "URL_DE_LA_VIDEO"
   ```

### Étape 4 : Vérifier la loop

Dans le code HTML/JS de la page, cherchez :
```html
<video loop autoplay muted playsinline>
  <source src="animation.webm" type="video/webm">
  <source src="animation.mov" type="video/quicktime">
</video>
```

Le `loop` est crucial pour les animations mobiles !

## Méthode 2 : Script d'inspection des exemples

Collez ce script dans la console sur une page d'exemple :

```javascript
// Analyser les animations des exemples masko.ai
(function() {
  console.log('🔍 Analyse des animations masko.ai...\n');
  
  // Trouver toutes les vidéos
  const videos = document.querySelectorAll('video');
  const sources = document.querySelectorAll('source');
  
  console.log(`📹 ${videos.length} éléments <video> trouvés`);
  console.log(`🔗 ${sources.length} éléments <source> trouvés\n`);
  
  // Analyser chaque vidéo
  videos.forEach((video, index) => {
    console.log(`\n📹 Vidéo ${index + 1}:`);
    console.log('  - Loop:', video.hasAttribute('loop'));
    console.log('  - Autoplay:', video.hasAttribute('autoplay'));
    console.log('  - Muted:', video.hasAttribute('muted'));
    console.log('  - PlaysInline:', video.hasAttribute('playsinline'));
    console.log('  - Current Source:', video.currentSrc);
    console.log('  - Duration:', video.duration, 'seconds');
    console.log('  - Video Width:', video.videoWidth);
    console.log('  - Video Height:', video.videoHeight);
  });
  
  // Analyser chaque source
  sources.forEach((source, index) => {
    console.log(`\n🔗 Source ${index + 1}:`);
    console.log('  - URL:', source.src);
    console.log('  - Type:', source.type);
    
    // Extraire le format
    if (source.src.includes('.webm')) {
      console.log('  - Format: WebM VP9 (Chrome/Firefox/Android)');
    } else if (source.src.includes('.mov')) {
      console.log('  - Format: MOV HEVC (Safari/iOS)');
    }
  });
  
  // Chercher les patterns de loop dans le code
  console.log('\n🔍 Analyse du code JavaScript...');
  const scripts = Array.from(document.scripts);
  scripts.forEach((script, index) => {
    if (script.textContent) {
      const content = script.textContent;
      if (content.includes('loop') || content.includes('autoplay')) {
        console.log(`\n📜 Script ${index + 1} contient des références à loop/autoplay`);
        // Extraire les lignes pertinentes
        const lines = content.split('\n');
        lines.forEach((line, lineNum) => {
          if (line.includes('loop') || line.includes('autoplay')) {
            console.log(`  Ligne ${lineNum + 1}: ${line.trim().substring(0, 100)}`);
          }
        });
      }
    }
  });
  
  console.log('\n✅ Analyse terminée !');
  console.log('\n💡 Pour analyser les métadonnées vidéo, utilisez :');
  console.log('   https://probe.video/');
  console.log('   Collez l\'URL d\'une vidéo pour voir ses détails techniques');
})();
```

## Méthode 3 : Analyser les métadonnées avec probe.video

1. Sur une page d'exemple masko.ai, trouvez l'URL d'une vidéo
2. Allez sur https://probe.video/
3. Collez l'URL de la vidéo
4. Vous verrez :
   - Codec (VP9, HEVC)
   - Bitrate
   - FPS
   - Durée
   - Résolution
   - Support alpha channel

## Ce qu'on peut découvrir

### Informations techniques :
- **Codec** : VP9 pour WebM, HEVC pour MOV
- **FPS** : Probablement 12fps (comme nous)
- **Durée** : Probablement ~1 seconde (12 frames)
- **Résolution** : 360px, 480px, 720px selon l'exemple
- **Alpha channel** : Présent dans les deux formats

### Configuration loop :
- Les vidéos doivent avoir `loop` dans le HTML
- Les vidéos doivent être courtes (1-2 secondes) pour une loop fluide
- Le format Lottie a un loop natif

## Comparaison avec notre implémentation

| Aspect | masko.ai | Notre implémentation | Action |
|--------|----------|---------------------|--------|
| Loop HTML | ✅ Probablement | ❓ À vérifier | Ajouter `loop` |
| Durée | ~1 seconde | 1 seconde (12 frames) | ✅ OK |
| Formats | WebM + MOV | WebM + MOV + Lottie | ✅ OK |
| Alpha | ✅ Oui | ✅ Oui | ✅ OK |
| FPS | Probablement 12 | 12 | ✅ OK |

## Prochaines étapes

1. ✅ Analyser les exemples publics
2. ✅ Vérifier la configuration loop dans notre frontend
3. ✅ S'assurer que les vidéos sont courtes pour une loop fluide
4. ✅ Tester sur mobile
