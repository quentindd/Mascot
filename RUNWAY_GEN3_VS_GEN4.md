# Runway Gen 3 vs Gen 4 : Quelle version choisir ?

## 📊 Comparaison

| Critère | Gen 3 Alpha Turbo | Gen 4 Turbo | Gen 4 (Standard) |
|---------|------------------|-------------|-----------------|
| **Qualité** | ⭐⭐⭐⭐ Professionnelle | ⭐⭐⭐⭐⭐ Excellente | ⭐⭐⭐⭐⭐ Meilleure |
| **Vitesse** | ⚡⚡⚡⚡⚡ Très rapide (7x plus rapide que Gen 3 standard) | ⚡⚡⚡⚡ Rapide | ⚡⚡⚡ Moyenne |
| **Coût** | 💰💰💰 5 crédits/seconde (~$0.05/s) | 💰💰💰💰 5 crédits/seconde (~$0.05/s) | 💰💰💰💰💰 Plus cher |
| **Cohérence temporelle** | ✅ Bonne | ✅✅ Excellente | ✅✅✅ Parfaite |
| **Détails** | ✅✅ Bon | ✅✅✅ Très bon | ✅✅✅✅ Excellent |

## 🎯 Recommandation pour les mascots

### **Gen 3 Alpha Turbo** (Recommandé par défaut)

**Pourquoi :**
- ✅ **Rapide** : 7x plus rapide que Gen 3 standard
- ✅ **Moins cher** : 50% moins cher que Gen 3 standard
- ✅ **Qualité professionnelle** : Parfait pour les mascots
- ✅ **Même prix que Gen 4 Turbo** : Mais plus rapide

**Idéal pour :**
- Génération rapide d'animations
- Budget optimisé
- Qualité professionnelle suffisante

### **Gen 4 Turbo** (Pour qualité premium)

**Pourquoi :**
- ✅ **Meilleure qualité** : Détails plus fins, meilleure cohérence
- ✅ **Même prix que Gen 3 Turbo** : 5 crédits/seconde
- ⚠️ **Un peu plus lent** : Mais toujours rapide

**Idéal pour :**
- Qualité maximale
- Projets clients/production
- Quand la qualité prime sur la vitesse

### **Gen 4 Standard** (Non recommandé)

- ⚠️ Plus cher
- ⚠️ Plus lent
- ✅ Meilleure qualité (mais overkill pour mascots)

## 💡 Configuration

### Option 1 : Variable d'environnement (Recommandé)

```bash
# Dans Railway ou .env
RUNWAY_MODEL=gen3a_turbo  # ou gen4_turbo
```

### Option 2 : Modifier le code

Dans `backend/src/modules/ai/runway.service.ts`, ligne 94 :
```typescript
model: 'gen3a_turbo', // Changez en 'gen4_turbo' si vous voulez Gen 4
```

## 📝 Modèles disponibles

D'après la documentation Runway API :
- `gen3a_turbo` : Gen 3 Alpha Turbo (rapide, qualité pro)
- `gen4_turbo` : Gen 4 Turbo (qualité premium, rapide)
- `gen4` : Gen 4 Standard (meilleure qualité, plus lent)
- `veo3.1` : Google Veo (alternative)
- `veo3.1_fast` : Google Veo Fast

## ✅ Recommandation finale

**Pour la production : `gen3a_turbo`**
- Rapide
- Qualité professionnelle
- Coût optimisé
- Parfait pour les mascots

**Pour qualité maximale : `gen4_turbo`**
- Meilleure qualité
- Même prix
- Un peu plus lent
- Idéal pour projets premium

Le code est configuré avec `gen3a_turbo` par défaut, mais vous pouvez changer via `RUNWAY_MODEL` !
