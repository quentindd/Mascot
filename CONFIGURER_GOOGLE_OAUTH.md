# 🔐 Configuration Google OAuth

## Pourquoi Google OAuth ?

Au lieu de demander aux utilisateurs de copier-coller un token API, ils peuvent maintenant se connecter directement avec leur compte Google en un clic !

## 📋 Étapes de configuration

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez le **Project ID**

### 2. Activer Google+ API

1. Dans Google Cloud Console, allez dans **APIs & Services** → **Library**
2. Recherchez "Google+ API" ou "Google Identity"
3. Cliquez sur **Enable**

### 3. Créer des identifiants OAuth 2.0

1. Allez dans **APIs & Services** → **Credentials**
2. Cliquez sur **Create Credentials** → **OAuth client ID**
3. Si c'est la première fois, configurez l'écran de consentement OAuth :
   - **User Type** : External (ou Internal si vous avez Google Workspace)
   - **App name** : Mascot
   - **User support email** : votre email
   - **Developer contact** : votre email
   - Cliquez sur **Save and Continue**
   - Scopes : gardez les valeurs par défaut
   - Test users : ajoutez votre email pour tester
   - Cliquez sur **Save and Continue**

4. Créez l'OAuth client ID :
   - **Application type** : Web application
   - **Name** : Mascot Backend
   - **Authorized redirect URIs** : 
     ```
     https://mascot-production.up.railway.app/api/v1/auth/google/callback
     ```
     (Remplacez par votre URL de production)
   - Cliquez sur **Create**

5. **Copiez** :
   - **Client ID** (ex: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (ex: `GOCSPX-abc123...`)

### 4. Ajouter les variables d'environnement dans Railway

Dans votre projet Railway, ajoutez ces variables :

```
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_CALLBACK_URL=https://mascot-production.up.railway.app/api/v1/auth/google/callback
```

### 5. Créer une migration pour ajouter googleId

```bash
cd backend
npm run migration:generate -- -n AddGoogleIdToUser
```

Puis éditez le fichier de migration généré pour ajouter :

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "users" 
    ADD COLUMN "googleId" character varying,
    ADD CONSTRAINT "UQ_users_googleId" UNIQUE ("googleId")
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "users" 
    DROP CONSTRAINT "UQ_users_googleId",
    DROP COLUMN "googleId"
  `);
}
```

Exécutez la migration :

```bash
npm run migration:run
```

### 6. Installer les dépendances

```bash
cd backend
npm install
```

### 7. Tester

1. Déployez le backend sur Railway
2. Dans le plugin Figma, cliquez sur **"Sign in with Google"**
3. Le navigateur s'ouvre avec Google OAuth
4. Connectez-vous avec votre compte Google
5. Vous êtes redirigé vers une page de succès
6. Le token est automatiquement envoyé au plugin (ou vous pouvez le copier)

## ✅ Résultat

Les utilisateurs peuvent maintenant :
- ✅ Se connecter en un clic avec Google
- ✅ Pas besoin de copier-coller de token
- ✅ Création automatique de compte si nouveau
- ✅ Avatar et nom récupérés depuis Google

## 🔧 Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL dans `GOOGLE_CALLBACK_URL` correspond exactement à celle dans Google Cloud Console
- Les URLs doivent correspondre caractère par caractère (http vs https, trailing slash, etc.)

### Erreur "invalid_client"
- Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont corrects
- Vérifiez qu'ils n'ont pas d'espaces avant/après

### Le plugin ne reçoit pas le token
- Le plugin écoute les messages `postMessage` depuis la fenêtre OAuth
- Si ça ne fonctionne pas, la page de callback affiche le token que vous pouvez copier manuellement
