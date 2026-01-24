# 📖 Guide complet étape par étape - Plugin Mascot

## 🚀 PREMIÈRE UTILISATION

### Étape 1 : Charger le plugin dans Figma

1. **Ouvrez Figma Desktop** (pas la version web)
2. **Ouvrez ou créez un fichier Figma**
   - ⚠️ Important : Le plugin a besoin d'une page pour insérer les images
3. **Allez dans le menu** : 
   - `Plugins` → `Development` → `Import plugin from manifest...`
4. **Sélectionnez le fichier** 
   - Naviguez vers le dossier `figma-plugin`
   - Sélectionnez `manifest.json`
5. **Le plugin apparaît** : `Plugins` → `Development` → `Mascot`

### Étape 2 : Lancer le plugin

1. **Allez dans** : `Plugins` → `Development` → `Mascot`
2. **OU utilisez le raccourci** : 
   - `Cmd+Option+P` (Mac) puis tapez "Mascot"
3. **Le panneau s'ouvre** sur le côté droit

### Étape 3 : Choisir le mode

Vous avez **deux options** :

#### 🎮 Option A : Mode Demo (pour tester)
1. Cliquez sur **"Try Demo Mode (No API access)"**
2. ✅ Vous pouvez explorer l'interface
3. ⚠️ Les images seront des placeholders (pas de vraies images AI)

#### 🔐 Option B : Mode Connecté (pour la vraie génération)
1. Cliquez sur **"Sign In with API Token"**
2. Entrez votre API token (voir section suivante)
3. Cliquez sur OK
4. ✅ Vous êtes connecté !

---

## 🔑 OBTENIR UN API TOKEN

### Pour l'instant (développement) :
- Le backend n'est pas encore déployé
- Vous pouvez utiliser un token de test
- Une fois le backend prêt, suivez les étapes ci-dessous

### Quand le backend sera prêt :
1. Allez sur **https://mascotforge.com/dashboard/api-keys**
2. **Connectez-vous** (ou créez un compte)
3. Cliquez sur **"Create API Token"**
4. Donnez un nom (ex: "Figma Plugin")
5. **Copiez le token** ⚠️ (vous ne pourrez plus le voir après !)
6. Collez-le dans le plugin

---

## 🎨 GÉNÉRER VOTRE PREMIER MASCOT

### Étape 1 : Aller dans l'onglet Character
- L'onglet **"Character"** est déjà sélectionné par défaut

### Étape 2 : Remplir le formulaire

1. **Name** : Donnez un nom
   - Exemple : "My Robot", "Blue Cat"

2. **Prompt** : Décrivez votre mascot
   - Exemple : "A friendly robot with big eyes, wearing a blue hat"
   - 💡 Plus de détails = meilleur résultat

3. **Style** : Choisissez un style
   - Kawaii : Mignon, style japonais
   - Cartoon : Style dessin animé
   - Flat : Style plat, minimaliste
   - Pixel : Style pixel art
   - 3D : Style 3D
   - Match Brand : Correspond à votre marque

### Étape 3 : Générer

1. Cliquez sur **"Generate Mascot (1 credit)"**
2. ⏳ Attendez :
   - Mode demo : 2-3 secondes
   - Vraie génération : 10-30 secondes
3. ✅ Message de succès apparaît

### Étape 4 : Voir le résultat

**Dans Figma** :
- L'image apparaît au **centre de votre vue actuelle**
- Taille : 512x512 pixels
- Elle est automatiquement sélectionnée

**Dans le plugin** :
- Le mascot apparaît dans "Existing Mascots"
- Avec une petite image à gauche
- Cliquez dessus pour le sélectionner

---

## 🎬 GÉNÉRER UNE ANIMATION

### Étape 1 : Sélectionner un mascot
1. Dans l'onglet **Character**
2. Cliquez sur un mascot existant
3. Il devient sélectionné (bordure bleue)

### Étape 2 : Aller dans Animations
1. Cliquez sur l'onglet **"Animations"**

### Étape 3 : Choisir une action
1. Sélectionnez une action (wave, jump, dance, etc.)
2. Choisissez la résolution
3. Cliquez sur **"Generate Animation"**

### Étape 4 : Attendre
- ⏳ Génération : 1-5 minutes
- Vous verrez les mises à jour de progression

---

## 🎨 GÉNÉRER UN LOGO PACK

### Étape 1 : Sélectionner un mascot
- Dans l'onglet **Character**, sélectionnez un mascot

### Étape 2 : Aller dans Logos
- Cliquez sur l'onglet **"Logos"**

### Étape 3 : Générer
1. Optionnel : Ajoutez des couleurs de marque
2. Cliquez sur **"Generate Logo Pack"**
3. ⏳ Attendez : 1-3 minutes

### Étape 4 : Télécharger
- Une fois généré, cliquez sur **"Insert in Figma"**

---

## 👤 GÉRER VOTRE COMPTE

### Voir vos crédits
1. Cliquez sur l'onglet **"Account"**
2. Vous voyez :
   - Crédits restants
   - Votre plan
   - Coûts des opérations

### Gérer la facturation
1. Dans **Account**, cliquez sur **"Manage Billing"**
2. Ouvre le dashboard web

---

## 🔧 DÉPANNAGE

### L'image n'apparaît pas dans Figma

1. ✅ **Vérifiez que vous êtes sur une page** (pas fichier vide)
2. 👀 **Regardez au centre de votre vue**
3. 🔍 **Zoom to fit** : `Cmd+Shift+1` (Mac) ou `Ctrl+Shift+1` (Windows)
4. 📋 **Panneau de gauche** : cherchez un rectangle avec le nom

### Le plugin ne se charge pas

1. ❌ **Fermez complètement Figma** (Quit)
2. ✅ **Rouvrez Figma**
3. 🔄 **Rechargez le plugin**

### Erreur de connexion

1. ✅ Vérifiez votre API token
2. 🌐 Vérifiez votre connexion internet
3. 🔗 Vérifiez que le backend est accessible

---

## 📚 RACCOURCIS

- **Ouvrir plugin** : `Cmd+Option+P` (Mac) → tapez "Mascot"
- **Zoom to fit** : `Cmd+Shift+1` (Mac) ou `Ctrl+Shift+1` (Windows)
- **Console** : `View` → `Toggle Developer Console`

---

## 💡 ASTUCES

1. 💾 **Sauvegardez vos mascots** : Ils sont dans votre compte
2. ♻️ **Réutilisez** : Sélectionnez un mascot pour animations/logos
3. 💳 **Gérez vos crédits** : Vérifiez dans Account
4. 🎮 **Mode demo** : Parfait pour tester avant de vous connecter
