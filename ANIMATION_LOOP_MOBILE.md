# Configuration Loop pour Animations Mobile

## ✅ Notre implémentation actuelle

### Formats générés :
1. **WebM VP9 avec alpha** - Compatible Chrome/Firefox/Android
2. **MOV HEVC avec alpha** - Compatible Safari/iOS  
3. **Lottie JSON** - Compatible toutes les plateformes
4. **Sprite Sheet PNG** - Pour jeux/fallback

### Durée des animations :
- **12 frames à 12fps = 1 seconde** ✅
- Parfait pour une loop fluide sur mobile

## 🔧 Configuration Loop nécessaire

### Pour les vidéos (WebM/MOV) :

Les vidéos doivent être affichées avec l'attribut `loop` :

```html
<video autoplay loop muted playsinline>
  <source src="{animation.webmVideoUrl}" type="video/webm">
  <source src="{animation.movVideoUrl}" type="video/quicktime">
</video>
```

**Attributs importants :**
- `loop` : Fait boucler la vidéo infiniment ✅
- `autoplay` : Démarre automatiquement
- `muted` : Requis pour autoplay sur mobile
- `playsinline` : Joue inline sur iOS (pas en plein écran)

### Pour Lottie :

Le Lottie JSON doit être configuré avec `loop: true` :

```javascript
// React Native
<LottieView
  source={{ uri: animation.lottieUrl }}
  autoPlay
  loop  // ✅ Loop activé
/>

// Web
lottie.loadAnimation({
  container: element,
  renderer: 'svg',
  loop: true,  // ✅ Loop activé
  autoplay: true,
  path: animation.lottieUrl
});
```

## 📱 Optimisation Mobile

### 1. Taille des fichiers

Nos animations sont optimisées pour mobile :
- **128px** : < 100KB (idéal pour notifications, icônes)
- **240px** : ~200KB (petites animations)
- **360px** : ~500KB (taille standard) ✅
- **480px** : ~1MB (animations plus grandes)
- **720px** : ~2-3MB (hero sections)

### 2. Durée courte

- **1 seconde** = loop fluide ✅
- Pas de coupure visible
- Performance optimale

### 3. Formats adaptés

- **WebM** : Android, Chrome, Firefox
- **MOV** : iOS, Safari
- **Lottie** : Toutes les plateformes (meilleur pour apps natives)

## 🎯 Comparaison avec masko.ai

| Aspect | masko.ai | Notre implémentation | Statut |
|--------|----------|---------------------|--------|
| Loop HTML | ✅ Oui | ⚠️ À vérifier dans frontend | À ajouter |
| Durée | ~1 seconde | 1 seconde | ✅ OK |
| Formats | WebM + MOV | WebM + MOV + Lottie | ✅ OK |
| Alpha | ✅ Oui | ✅ Oui | ✅ OK |
| Mobile optimisé | ✅ Oui | ✅ Oui | ✅ OK |

## 🔍 Analyser masko.ai sans crédits

Voir le fichier `analyze-masko-examples.md` pour :
- Analyser les exemples publics
- Inspecter les vidéos directement
- Vérifier leur configuration loop

## ✅ Actions à prendre

1. ✅ **Backend** : Animations générées correctement (1 seconde, formats OK)
2. ⚠️ **Frontend** : Vérifier que les vidéos ont `loop` dans le HTML
3. ⚠️ **Documentation** : Ajouter exemples d'utilisation avec loop
