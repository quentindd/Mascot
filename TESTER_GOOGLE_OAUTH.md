# 🧪 Guide de test - Google OAuth

## 📋 Prérequis

Avant de tester, assurez-vous que :

- ✅ Le code a été poussé sur GitHub
- ✅ Railway a redéployé l'application
- ✅ Les variables d'environnement sont configurées dans Railway :
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL` (optionnel, par défaut : `https://mascot-production.up.railway.app/api/v1/auth/google/callback`)
  - `BASE_URL` (optionnel, par défaut : `https://mascot-production.up.railway.app`)

---

## 🔍 Étape 1 : Vérifier que le backend est déployé

### 1.1 Test de santé

Ouvrez dans votre navigateur :
```
https://mascot-production.up.railway.app/api/v1
```

Vous devriez voir une réponse JSON avec les informations de santé de l'API.

### 1.2 Test de la route de test

Ouvrez :
```
https://mascot-production.up.railway.app/api/v1/auth/google/test
```

**Résultat attendu** :
```json
{
  "message": "Google OAuth route is registered",
  "timestamp": "2026-01-26T..."
}
```

✅ Si vous voyez ce message, le contrôleur est bien enregistré.

---

## 🔍 Étape 2 : Vérifier la stratégie Google

### 2.1 Route de debug

Ouvrez :
```
https://mascot-production.up.railway.app/api/v1/auth/google/debug
```

**Résultat attendu** :
```json
{
  "message": "Google OAuth debug info",
  "availableStrategies": ["local", "jwt", "google"],
  "hasGoogleStrategy": true,
  "timestamp": "2026-01-26T..."
}
```

✅ Si `hasGoogleStrategy: true`, la stratégie est bien enregistrée dans Passport.

❌ Si `hasGoogleStrategy: false`, vérifiez les logs Railway (voir Étape 3).

---

## 🔍 Étape 3 : Vérifier les logs Railway

1. Allez sur [Railway Dashboard](https://railway.app)
2. Ouvrez votre projet "Mascot"
3. Cliquez sur votre service backend
4. Allez dans l'onglet **"Logs"**

### Logs à rechercher :

✅ **Logs de succès** :
```
[GoogleStrategy] Initializing GoogleStrategy...
[GoogleStrategy] Has Client ID: true
[GoogleStrategy] Has Client Secret: true
[GoogleStrategy] Callback URL: https://mascot-production.up.railway.app/api/v1/auth/google/callback
[GoogleStrategy] GoogleStrategy initialized successfully
[AuthController] AuthController initialized - Google OAuth routes should be available
```

❌ **Logs d'erreur** :
```
[GoogleStrategy] Has Client ID: false
[GoogleStrategy] Has Client Secret: false
[GoogleStrategy] Google OAuth credentials not configured. Google OAuth will not work.
```

Si vous voyez des erreurs, vérifiez que les variables d'environnement sont bien définies dans Railway.

---

## 🌐 Étape 4 : Tester dans le navigateur

### 4.1 Test de la route Google OAuth

Ouvrez directement dans votre navigateur :
```
https://mascot-production.up.railway.app/api/v1/auth/google
```

**Comportement attendu** :
- ✅ Vous êtes **redirigé vers Google** pour vous connecter
- ✅ Après connexion, vous êtes redirigé vers `/api/v1/auth/google/callback`
- ✅ Une page HTML s'affiche avec "✅ Authentication Successful!"

**Comportement si ça ne fonctionne pas** :
- ❌ Erreur 404 : La route n'est pas enregistrée (vérifiez les logs)
- ❌ Erreur 500 : Problème avec la stratégie (vérifiez les logs)
- ❌ Pas de redirection : Les credentials Google sont incorrects

### 4.2 Vérifier le callback URL dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Ouvrez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID**
5. Vérifiez que l'**Authorized redirect URI** contient :
   ```
   https://mascot-production.up.railway.app/api/v1/auth/google/callback
   ```

⚠️ **Important** : Le callback URL doit correspondre **exactement** à celui configuré dans Railway.

---

## 🎨 Étape 5 : Tester dans le plugin Figma

### 5.1 Rebuild le plugin

```bash
cd figma-plugin
npm run build
```

### 5.2 Ouvrir le plugin dans Figma

1. Ouvrez Figma Desktop ou Figma Web
2. Créez un nouveau fichier ou ouvrez un fichier existant
3. Allez dans **Plugins** > **Development** > **Mascot**
4. Si le plugin n'apparaît pas, rechargez-le :
   - **Figma Desktop** : `Cmd + Option + P` (Mac) ou `Ctrl + Alt + P` (Windows)
   - **Figma Web** : Fermez et rouvrez le plugin

### 5.3 Tester la connexion Google

1. Dans le plugin, vous devriez voir un bouton **"🔵 Sign in with Google"**
2. Cliquez sur ce bouton
3. Une nouvelle fenêtre devrait s'ouvrir avec la page de connexion Google
4. Connectez-vous avec votre compte Google
5. Après connexion :
   - ✅ La fenêtre se ferme automatiquement
   - ✅ Le plugin reçoit le token d'authentification
   - ✅ Vous êtes connecté dans le plugin

### 5.4 Vérifier la connexion

Après connexion, vous devriez voir :
- ✅ Votre nom/email affiché dans le plugin
- ✅ Le bouton "Sign in" remplacé par "Sign out" ou votre profil
- ✅ Vous pouvez générer des mascots

---

## 🐛 Dépannage

### Problème : Erreur 404 sur `/api/v1/auth/google`

**Solutions** :
1. Vérifiez que Railway a bien redéployé (regardez les logs de build)
2. Vérifiez les logs Railway pour voir si `GoogleStrategy` s'initialise
3. Testez `/api/v1/auth/google/debug` pour voir si la stratégie est disponible

### Problème : Erreur "redirect_uri_mismatch" de Google

**Cause** : Le callback URL ne correspond pas à celui configuré dans Google Cloud Console.

**Solution** :
1. Vérifiez le callback URL dans les logs Railway : `[GoogleStrategy] Callback URL: ...`
2. Assurez-vous que ce même URL est dans Google Cloud Console > OAuth 2.0 Client > Authorized redirect URIs

### Problème : La fenêtre s'ouvre mais se ferme immédiatement

**Cause** : Le callback ne peut pas communiquer avec le plugin.

**Solutions** :
1. Vérifiez que `figma-plugin/manifest.json` contient :
   ```json
   "networkAccess": {
     "allowedDomains": [
       "https://*.railway.app",
       "https://mascot-production.up.railway.app"
     ]
   }
   ```
2. Vérifiez que le plugin écoute les messages `postMessage` (voir `figma-plugin/src/ui/App.tsx`)

### Problème : "Google OAuth credentials not configured"

**Solution** :
1. Allez dans Railway > Variables d'environnement
2. Ajoutez :
   - `GOOGLE_CLIENT_ID` = votre Client ID de Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` = votre Client Secret de Google Cloud Console
3. Redéployez l'application

### Problème : Le plugin ne reçoit pas le token

**Solutions** :
1. Ouvrez la console du navigateur (F12) dans la fenêtre du callback
2. Vérifiez s'il y a des erreurs JavaScript
3. Vérifiez que `window.opener` existe (la fenêtre a été ouverte par le plugin)
4. Vérifiez que le plugin écoute les messages (voir `App.tsx`)

---

## ✅ Checklist de test complète

- [ ] Route `/api/v1/auth/google/test` fonctionne
- [ ] Route `/api/v1/auth/google/debug` montre `hasGoogleStrategy: true`
- [ ] Logs Railway montrent `GoogleStrategy initialized successfully`
- [ ] Route `/api/v1/auth/google` redirige vers Google
- [ ] Connexion Google fonctionne
- [ ] Callback redirige vers la page de succès
- [ ] Plugin Figma peut ouvrir la fenêtre OAuth
- [ ] Plugin reçoit le token après connexion
- [ ] Utilisateur est connecté dans le plugin
- [ ] Génération de mascot fonctionne avec le compte connecté

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs Railway** pour les erreurs
2. **Vérifiez la console du navigateur** (F12) pour les erreurs JavaScript
3. **Vérifiez les logs du plugin Figma** : `Plugins` > `Development` > `Open Console`

---

## 🎯 Test rapide (1 minute)

Pour un test rapide, ouvrez simplement :
```
https://mascot-production.up.railway.app/api/v1/auth/google
```

Si vous êtes redirigé vers Google, **ça fonctionne !** ✅
