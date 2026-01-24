# Comment obtenir un API Token - Guide pratique

## 🎯 Situation actuelle

Vous avez le **code** du projet, mais **pas de backend déployé**. Les URLs comme `https://mascot.com` dans le code sont des **exemples** - elles ne fonctionnent pas encore.

## ✅ Solutions possibles

### Option 1 : Tester en local avec un tunnel (Recommandé pour commencer)

Cette option vous permet de tester le plugin **maintenant** sans déployer quoi que ce soit.

#### Étape 1 : Démarrer le backend localement

```bash
cd backend
npm install
npm run start:dev
```

Le backend devrait démarrer sur `http://localhost:3000`

#### Étape 2 : Créer un tunnel avec ngrok (gratuit)

1. **Installez ngrok** : https://ngrok.com/download

2. **Créez un tunnel** :
```bash
ngrok http 3000
```

Vous obtiendrez une URL comme : `https://abc123.ngrok.io`

3. **Mettez à jour le plugin** pour utiliser cette URL :

**Fichier** : `figma-plugin/src/api/client.ts`
```typescript
const API_BASE_URL = 'https://abc123.ngrok.io/api/v1';  // ← Remplacez par votre URL ngrok
```

4. **Mettez à jour le manifest** pour autoriser ce domaine :

**Fichier** : `figma-plugin/manifest.json`
```json
"networkAccess": {
  "allowedDomains": [
    "https://abc123.ngrok.io"  // ← Ajoutez votre URL ngrok
  ]
}
```

5. **Rebuildez le plugin** :
```bash
cd figma-plugin
npm run build
```

#### Étape 3 : Créer un compte et obtenir un token

```bash
# Créer un compte
curl -X POST https://abc123.ngrok.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Réponse :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Le `accessToken` est votre API token !**

#### Étape 4 : Utiliser le token dans le plugin

1. Ouvrez le plugin Figma
2. Cliquez sur "Sign In with API Token"
3. Collez le `accessToken` que vous avez obtenu

---

### Option 2 : Déployer le backend (Pour la production)

Si vous voulez un backend permanent, vous devez le déployer.

#### Services de déploiement recommandés

1. **Railway** (facile, gratuit au début) : https://railway.app
2. **Render** (gratuit) : https://render.com
3. **Heroku** (payant maintenant)
4. **AWS / Google Cloud / Azure** (plus complexe)

#### Après déploiement

1. Votre backend sera accessible sur une URL comme : `https://votre-app.railway.app`
2. Mettez à jour `figma-plugin/src/api/client.ts` avec cette URL
3. Mettez à jour `figma-plugin/manifest.json` pour autoriser ce domaine
4. Créez un compte via l'API et obtenez un token

---

### Option 3 : Mode développement sans backend (Temporaire)

Si vous voulez juste tester l'interface du plugin **sans backend**, vous pouvez :

1. **Modifier le code pour accepter n'importe quel token** (non recommandé pour la production)
2. **Utiliser des données mockées** (déjà implémenté partiellement)

Mais pour générer de **vraies images**, vous **devez** avoir un backend qui fonctionne.

---

## 🚀 Recommandation : Commencez par l'Option 1

L'Option 1 (local + ngrok) est la **plus rapide** pour tester :

1. ✅ Pas besoin de déployer
2. ✅ Fonctionne immédiatement
3. ✅ Gratuit
4. ✅ Parfait pour le développement

**Inconvénient** : L'URL ngrok change à chaque redémarrage (sauf avec un compte payant).

---

## 📝 Checklist rapide

- [ ] Backend installé et démarré (`npm run start:dev`)
- [ ] ngrok installé et tunnel créé
- [ ] URL ngrok ajoutée dans `figma-plugin/src/api/client.ts`
- [ ] URL ngrok ajoutée dans `figma-plugin/manifest.json`
- [ ] Plugin rebundlé (`npm run build`)
- [ ] Compte créé via l'API
- [ ] Token obtenu (`accessToken`)
- [ ] Token utilisé dans le plugin Figma

---

## ❓ Questions fréquentes

**Q : Pourquoi ngrok change d'URL ?**
R : Avec le plan gratuit, ngrok génère une nouvelle URL à chaque redémarrage. Pour une URL fixe, il faut un compte payant ou déployer le backend.

**Q : Puis-je tester sans backend ?**
R : Vous pouvez tester l'interface, mais pas la génération réelle d'images.

**Q : Dois-je déployer maintenant ?**
R : Non, commencez par tester en local avec ngrok. Déployez quand vous êtes prêt pour la production.

**Q : Le backend nécessite une base de données ?**
R : Oui, le backend utilise PostgreSQL. Pour le développement local, vous pouvez utiliser Docker ou une base de données locale.

---

## 🔧 Prochaines étapes

1. **Choisissez une option** (recommandé : Option 1)
2. **Suivez les étapes** de l'option choisie
3. **Testez** la génération d'un mascot
4. **Si ça fonctionne**, vous pouvez ensuite déployer pour la production

Dites-moi quelle option vous préférez et je vous guide étape par étape ! 🚀
