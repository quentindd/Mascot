# 🔧 Configurer l'accès GitHub dans Railway

## Problème

Railway affiche "No repositories found" - cela signifie que Railway n'a pas l'autorisation d'accéder à vos repos GitHub.

---

## Solution : Configurer GitHub App

### Étape 1 : Cliquer sur "Configure GitHub App"

Dans la fenêtre Railway, cliquez sur **"Configure GitHub App"** (l'option avec l'icône d'engrenage).

### Étape 2 : Autoriser Railway

Vous serez redirigé vers GitHub pour autoriser Railway :

1. **Sélectionnez les repositories** :
   - ✅ **"All repositories"** (recommandé)
   - OU ✅ **"Only select repositories"** → Choisissez `mascot`

2. Cliquez sur **"Install & Authorize"**

### Étape 3 : Retour sur Railway

Vous serez redirigé vers Railway, et maintenant vous devriez voir votre repo `mascot` !

---

## Alternative : Si le repo n'existe pas encore

Si vous n'avez pas encore créé le repo GitHub :

1. **Annulez** la création du projet Railway
2. **Créez d'abord le repo** sur GitHub : https://github.com/new
3. **Poussez le code** :
   ```bash
   cd /Users/quentin/Documents/Mascot
   git remote add origin https://github.com/VOTRE_USERNAME/mascot.git
   git branch -M main
   git push -u origin main
   ```
4. **Revenez sur Railway** et recommencez

---

## Vérification

Après avoir configuré l'accès :
- ✅ Railway affiche une liste de vos repos
- ✅ Vous voyez `mascot` dans la liste
- ✅ Vous pouvez le sélectionner

---

## Prochaines étapes

Une fois le repo sélectionné :
1. Railway build automatiquement
2. Ajoutez PostgreSQL (+ New → Database)
3. Ajoutez Redis (+ New → Database)
4. Configurez les variables d'environnement
5. Générez un domaine

---

## 🆘 Toujours "No repositories found" ?

### Vérifiez que :

1. **Le repo existe bien sur GitHub**
   - Allez sur https://github.com/VOTRE_USERNAME/mascot
   - Vous devez voir votre code

2. **Railway a les permissions**
   - Allez sur https://github.com/settings/installations
   - Cherchez "Railway"
   - Vérifiez que `mascot` est autorisé

3. **Vous êtes connecté avec le bon compte GitHub**
   - Vérifiez en haut à droite de Railway
   - Si nécessaire, déconnectez-vous et reconnectez

---

## 🎯 Résumé

**SI le repo GitHub existe déjà** :
- → Cliquez sur "Configure GitHub App"
- → Autorisez Railway
- → Sélectionnez `mascot`

**SI le repo n'existe pas encore** :
- → Créez-le d'abord : https://github.com/new
- → Poussez le code
- → Puis revenez sur Railway
