# 🔐 Guide étape par étape : Configuration Google OAuth

## 📋 Vue d'ensemble

Ce guide vous accompagne pour configurer Google OAuth afin que vos utilisateurs puissent se connecter avec leur compte Google en un clic.

**Temps estimé : 15-20 minutes**

---

## Étape 1 : Accéder à Google Cloud Console

1. Allez sur : https://console.cloud.google.com/
2. **Connectez-vous** avec votre compte Google
3. Si vous avez plusieurs comptes, choisissez celui que vous voulez utiliser

---

## Étape 2 : Créer ou sélectionner un projet

### Option A : Utiliser un projet existant

1. En haut de la page, cliquez sur le **sélecteur de projet** (à côté de "Google Cloud")
2. Sélectionnez votre projet existant (ex: `mascot-485416`)

### Option B : Créer un nouveau projet

1. Cliquez sur le **sélecteur de projet**
2. Cliquez sur **"New Project"**
3. **Project name** : `Mascot OAuth` (ou un nom de votre choix)
4. Cliquez sur **"Create"**
5. Attendez quelques secondes que le projet soit créé
6. Sélectionnez ce nouveau projet

**✅ Notez le Project ID** (visible dans le sélecteur de projet)

---

## Étape 3 : Activer l'API (Optionnel mais recommandé)

⚠️ **Note importante** : Pour OAuth 2.0, vous n'avez **pas besoin** d'activer une API spécifique. Les endpoints OAuth de Google sont disponibles par défaut. Cependant, activer une API peut être utile pour le suivi et la gestion.

### Option A : Activer Google+ API (Recommandé)

1. Dans le menu de gauche, allez dans **"APIs & Services"** → **"Library"**
2. Dans la barre de recherche, tapez : **"Google+ API"**
3. Si vous ne le trouvez pas, essayez : **"Google Identity"**
4. Cliquez sur **"Google+ API"** ou **"Google Identity Services API"**
5. Cliquez sur le bouton **"Enable"** (Activer)
6. Attendez quelques secondes que l'API soit activée

### Option B : Passer directement à l'étape 4

Si vous ne trouvez pas ces APIs ou préférez aller plus vite, vous pouvez **passer directement à l'étape 4** (Configuration de l'écran de consentement). Les APIs OAuth fonctionnent sans activation explicite.

**✅ Vous pouvez maintenant passer à l'étape suivante**

---

## Étape 4 : Configurer l'écran de consentement OAuth

1. Dans le menu de gauche, allez dans **"APIs & Services"** → **"OAuth consent screen"**
2. **User Type** : Sélectionnez **"External"** (sauf si vous avez Google Workspace, alors "Internal")
3. Cliquez sur **"Create"**

### Informations de l'application

4. **App name** : `Mascot` (ou le nom de votre choix)
5. **User support email** : Sélectionnez votre email dans la liste déroulante
6. **App logo** : (Optionnel) Vous pouvez uploader un logo
7. **Application home page** : `https://mascot-production.up.railway.app` (votre URL de production)
8. **Application privacy policy link** : (Optionnel pour le moment)
9. **Application terms of service link** : (Optionnel pour le moment)
10. **Authorized domains** : Laissez vide pour le moment
11. **Developer contact information** : Votre email
12. Cliquez sur **"Save and Continue"**

### Scopes (Portées)

13. Cliquez sur **"Add or Remove Scopes"**
14. Dans la liste, sélectionnez :
    - ✅ `.../auth/userinfo.email`
    - ✅ `.../auth/userinfo.profile`
15. Cliquez sur **"Update"**
16. Cliquez sur **"Save and Continue"**

### Test users (Utilisateurs de test)

17. Si votre app est en mode "Testing", ajoutez les emails de test :
    - Cliquez sur **"Add Users"**
    - Entrez votre email (et ceux de vos testeurs)
    - Cliquez sur **"Add"**
18. Cliquez sur **"Save and Continue"**

### Résumé

19. Vérifiez les informations
20. Cliquez sur **"Back to Dashboard"**

**✅ L'écran de consentement est configuré**

---

## Étape 5 : Créer les identifiants OAuth 2.0

1. Dans le menu de gauche, allez dans **"APIs & Services"** → **"Credentials"**
2. En haut de la page, cliquez sur **"+ CREATE CREDENTIALS"**
3. Sélectionnez **"OAuth client ID"**

### Configuration OAuth Client

4. **Application type** : Sélectionnez **"Web application"**
5. **Name** : `Mascot Backend` (ou un nom de votre choix)

### Authorized redirect URIs

6. Cliquez sur **"+ ADD URI"**
7. Entrez exactement cette URL (remplacez par votre URL de production si différente) :
   ```
   https://mascot-production.up.railway.app/api/v1/auth/google/callback
   ```
   ⚠️ **Important** : 
   - L'URL doit être **exactement** la même (pas d'espace, pas de slash à la fin)
   - Utilisez `https://` (pas `http://`)
   - Pas de trailing slash

8. Cliquez sur **"CREATE"**

### Copier les identifiants

9. Une popup s'affiche avec vos identifiants :
   - **Your Client ID** : `123456789-abc...apps.googleusercontent.com`
   - **Your Client Secret** : `GOCSPX-abc123...`

10. **⚠️ IMPORTANT** : Copiez ces deux valeurs maintenant, vous ne pourrez plus voir le secret plus tard !
    - Cliquez sur **"OK"** après avoir copié

**✅ Vous avez maintenant :**
- ✅ Client ID
- ✅ Client Secret

---

## Étape 6 : Ajouter les variables dans Railway

1. Allez sur votre projet Railway : https://railway.app/
2. Sélectionnez votre projet **Mascot**
3. Cliquez sur votre service backend
4. Allez dans l'onglet **"Variables"**
5. Cliquez sur **"+ New Variable"** pour chaque variable :

### Variable 1 : GOOGLE_CLIENT_ID

- **Name** : `GOOGLE_CLIENT_ID`
- **Value** : Collez votre **Client ID** (ex: `123456789-abc...apps.googleusercontent.com`)
- Cliquez sur **"Add"**

### Variable 2 : GOOGLE_CLIENT_SECRET

- **Name** : `GOOGLE_CLIENT_SECRET`
- **Value** : Collez votre **Client Secret** (ex: `GOCSPX-abc123...`)
- Cliquez sur **"Add"**

### Variable 3 : GOOGLE_CALLBACK_URL

- **Name** : `GOOGLE_CALLBACK_URL`
- **Value** : `https://mascot-production.up.railway.app/api/v1/auth/google/callback`
  (Remplacez par votre URL si différente)
- Cliquez sur **"Add"**

**✅ Les variables sont configurées**

---

## Étape 7 : Créer la migration pour googleId

1. Ouvrez un terminal
2. Allez dans le dossier backend :

```bash
cd /Users/quentin/Documents/Mascot/backend
```

3. Générez la migration :

```bash
npm run migration:generate -- -n AddGoogleIdToUser
```

4. Un fichier sera créé dans `src/migrations/` avec un nom comme `1234567890-AddGoogleIdToUser.ts`

5. **Ouvrez ce fichier** et remplacez son contenu par :

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIdToUser1234567890 implements MigrationInterface {
  name = 'AddGoogleIdToUser1234567890';

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
}
```

⚠️ **Important** : Remplacez `1234567890` dans le nom de la classe par le timestamp réel du fichier.

6. Exécutez la migration :

```bash
npm run migration:run
```

**✅ La base de données est prête**

---

## Étape 8 : Installer les dépendances et déployer

1. Installez les nouvelles dépendances :

```bash
cd /Users/quentin/Documents/Mascot/backend
npm install
```

2. Poussez le code sur GitHub (Railway se redéploiera automatiquement) :

```bash
cd /Users/quentin/Documents/Mascot
git add .
git commit -m "Add Google OAuth authentication"
git push
```

3. Attendez que Railway redéploie (quelques minutes)

**✅ Le backend est prêt**

---

## Étape 9 : Tester dans le plugin Figma

1. **Ouvrez Figma Desktop**
2. **Ouvrez ou créez un fichier**
3. **Lancez le plugin** : Plugins → Development → MascotForge
4. **Cliquez sur "🔵 Sign in with Google"**
5. Le navigateur s'ouvre avec Google OAuth
6. **Connectez-vous** avec votre compte Google
7. **Autorisez** l'application Mascot
8. Vous êtes redirigé vers une page de succès
9. **Retournez dans Figma** - vous devriez être connecté !

**✅ Google OAuth fonctionne !**

---

## 🔧 Dépannage

### Erreur "redirect_uri_mismatch"

**Problème** : L'URL de callback ne correspond pas exactement.

**Solution** :
1. Vérifiez dans Google Cloud Console → Credentials → votre OAuth client
2. Vérifiez que l'URL dans "Authorized redirect URIs" est **exactement** :
   ```
   https://mascot-production.up.railway.app/api/v1/auth/google/callback
   ```
3. Pas d'espace, pas de slash à la fin, exactement comme ci-dessus
4. Vérifiez aussi la variable `GOOGLE_CALLBACK_URL` dans Railway

### Erreur "invalid_client"

**Problème** : Le Client ID ou Secret est incorrect.

**Solution** :
1. Vérifiez dans Railway que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont corrects
2. Pas d'espaces avant/après
3. Si vous avez perdu le secret, créez un nouveau OAuth client dans Google Cloud

### Le plugin ne reçoit pas le token automatiquement

**Problème** : Le message postMessage ne fonctionne pas.

**Solution** :
1. La page de callback affiche le token
2. Vous pouvez le copier manuellement
3. Collez-le dans le plugin avec "Sign In with API Token"

### L'app est en mode "Testing" et d'autres utilisateurs ne peuvent pas se connecter

**Solution** :
1. Dans Google Cloud Console → OAuth consent screen
2. Ajoutez les emails des utilisateurs dans "Test users"
3. OU soumettez l'app pour vérification (pour production)

---

## ✅ Checklist finale

- [ ] Projet Google Cloud créé/sélectionné
- [ ] API Google Identity activée
- [ ] Écran de consentement OAuth configuré
- [ ] OAuth Client ID créé avec redirect URI correct
- [ ] Client ID et Secret copiés
- [ ] Variables ajoutées dans Railway (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL)
- [ ] Migration exécutée (googleId ajouté à la table users)
- [ ] Dépendances installées (npm install)
- [ ] Code poussé sur GitHub
- [ ] Railway redéployé
- [ ] Testé dans le plugin Figma

---

## 🎉 Félicitations !

Vos utilisateurs peuvent maintenant se connecter avec Google en un clic ! 🚀
