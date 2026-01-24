# Guide étape par étape - Plugin Mascot

## 🚀 Première utilisation

### Étape 1 : Charger le plugin dans Figma

1. **Ouvrez Figma Desktop** (pas la version web)
2. **Ouvrez ou créez un fichier Figma**
   - Le plugin a besoin d'une page pour insérer les images
3. **Allez dans le menu** : `Plugins` → `Development` → `Import plugin from manifest...`
4. **Sélectionnez le fichier** `manifest.json` dans le dossier `figma-plugin`
5. Le plugin apparaît dans la liste : `Plugins` → `Development` → `Mascot`

### Étape 2 : Lancer le plugin

1. **Allez dans** : `Plugins` → `Development` → `Mascot`
2. **OU utilisez le raccourci** : `Cmd+Option+P` (Mac) puis tapez "Mascot"
3. Le panneau du plugin s'ouvre sur le côté droit

### Étape 3 : Choisir le mode

Vous avez deux options :

#### Option A : Mode Demo (pour tester)
1. Cliquez sur **"Try Demo Mode (No API access)"**
2. Vous pouvez explorer l'interface
3. Les images générées seront des placeholders (pas de vraies images AI)

#### Option B : Mode Connecté (pour la vraie génération)
1. Cliquez sur **"Sign In with API Token"**
2. Entrez votre API token (voir ci-dessous comment l'obtenir)
3. Cliquez sur OK
4. Vous êtes maintenant connecté !

## 📝 Comment obtenir un API token

### Pour l'instant (développement) :
1. Le backend n'est pas encore déployé
2. Vous pouvez utiliser un token de test ou créer un compte de test
3. Une fois le backend déployé, allez sur `https://mascotforge.com/dashboard/api-keys`

### Quand le backend sera prêt :
1. Allez sur **https://mascotforge.com/dashboard/api-keys**
2. Connectez-vous (ou créez un compte)
3. Cliquez sur **"Create API Token"**
4. Donnez un nom au token (ex: "Figma Plugin")
5. **Copiez le token** (vous ne pourrez plus le voir après !)
6. Collez-le dans le plugin

## 🎨 Générer votre premier mascot

### Étape 1 : Aller dans l'onglet Character

1. Une fois connecté (ou en mode demo), vous voyez 4 onglets
2. Cliquez sur **"Character"** (déjà sélectionné par défaut)

### Étape 2 : Remplir le formulaire

1. **Name** : Donnez un nom à votre mascot
   - Exemple : "My Robot", "Blue Cat", etc.

2. **Prompt** : Décrivez votre mascot
   - Exemple : "A friendly robot with big eyes, wearing a blue hat"
   - Plus de détails = meilleur résultat

3. **Style** : Choisissez un style
   - Kawaii : Mignon, style japonais
   - Cartoon : Style dessin animé
   - Flat : Style plat, minimaliste
   - Pixel : Style pixel art
   - 3D : Style 3D
   - Match Brand : Correspond à votre marque

### Étape 3 : Générer

1. Cliquez sur **"Generate Mascot (1 credit)"**
2. Attendez 2-3 secondes (mode demo) ou 10-30 secondes (vraie génération)
3. Un message de succès apparaît

### Étape 4 : Voir le résultat

1. **Dans Figma** :
   - L'image apparaît au **centre de votre vue actuelle**
   - Taille : 512x512 pixels
   - Elle est automatiquement sélectionnée

2. **Dans le plugin** :
   - Le mascot apparaît dans la liste "Existing Mascots"
   - Avec une petite image à gauche
   - Cliquez dessus pour le sélectionner

## 🎬 Générer une animation

### Étape 1 : Sélectionner un mascot

1. Dans l'onglet **Character**, cliquez sur un mascot existant
2. Il devient sélectionné (bordure bleue)

### Étape 2 : Aller dans l'onglet Animations

1. Cliquez sur l'onglet **"Animations"**
2. Vous voyez les options d'animation

### Étape 3 : Choisir une action

1. Sélectionnez une action (ex: "wave", "jump", "dance")
2. Choisissez la résolution
3. Cliquez sur **"Generate Animation"**

### Étape 4 : Attendre la génération

1. L'animation est générée en arrière-plan
2. Cela peut prendre 1-5 minutes
3. Vous verrez les mises à jour de progression

## 🎨 Générer un logo pack

### Étape 1 : Sélectionner un mascot

1. Dans l'onglet **Character**, sélectionnez un mascot

### Étape 2 : Aller dans l'onglet Logos

1. Cliquez sur l'onglet **"Logos"**
2. Vous voyez les options de logo

### Étape 3 : Générer

1. Optionnel : Ajoutez des couleurs de marque
2. Cliquez sur **"Generate Logo Pack"**
3. Attendez la génération (1-3 minutes)

### Étape 4 : Télécharger

1. Une fois généré, vous verrez tous les formats
2. Cliquez sur **"Insert in Figma"** pour insérer les logos

## 👤 Gérer votre compte

### Voir vos crédits

1. Cliquez sur l'onglet **"Account"**
2. Vous voyez :
   - Crédits restants
   - Votre plan
   - Coûts des opérations

### Gérer la facturation

1. Dans l'onglet **Account**, cliquez sur **"Manage Billing"**
2. Cela ouvre le dashboard web dans votre navigateur

## 🔧 Dépannage

### L'image n'apparaît pas dans Figma

1. **Vérifiez que vous êtes sur une page** (pas sur un fichier vide)
2. **Regardez au centre de votre vue** (là où vous regardez actuellement)
3. **Utilisez Zoom to fit** : `Cmd+Shift+1` (Mac) ou `Ctrl+Shift+1` (Windows)
4. **Vérifiez le panneau de gauche** : cherchez un rectangle avec le nom de votre mascot

### Le plugin ne se charge pas

1. **Fermez complètement Figma** (Quit, pas juste fermer)
2. **Rouvrez Figma**
3. **Rechargez le plugin** : `Plugins` → `Development` → `Mascot`

### Erreur de connexion

1. **Vérifiez votre API token** : est-il correct ?
2. **Vérifiez votre connexion internet**
3. **Vérifiez que le backend est accessible**

### Mode demo ne fonctionne pas

1. **Ouvrez la console** : `View` → `Toggle Developer Console`
2. **Cherchez les erreurs** commençant par `[Mascot]`
3. **Envoyez-moi les erreurs** pour que je puisse aider

## 📚 Raccourcis utiles

- **Ouvrir le plugin** : `Cmd+Option+P` (Mac) puis tapez "Mascot"
- **Zoom to fit** : `Cmd+Shift+1` (Mac) ou `Ctrl+Shift+1` (Windows)
- **Console** : `View` → `Toggle Developer Console`

## 💡 Astuces

1. **Sauvegardez vos mascots** : Ils sont sauvegardés dans votre compte
2. **Réutilisez les mascots** : Sélectionnez un mascot existant pour créer des animations/logos
3. **Gérez vos crédits** : Vérifiez régulièrement dans l'onglet Account
4. **Mode demo** : Parfait pour tester l'interface avant de vous connecter
