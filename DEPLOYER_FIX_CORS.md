# 🚀 Déployer le correctif CORS

## Le problème

Le backend bloque les requêtes depuis `railway.com` à cause de CORS. J'ai déjà modifié le code pour autoriser `railway.com` et `railway.app`.

## ✅ Solution : Pousser le changement vers GitHub

Railway déploie automatiquement les changements depuis GitHub.

### Étapes :

1. **Vérifiez que vous êtes connecté à GitHub** :
   ```bash
   git remote -v
   ```

2. **Poussez le changement** :
   ```bash
   git push origin main
   ```

   Si ça ne fonctionne pas (problème réseau), attendez quelques minutes et réessayez.

3. **Railway va automatiquement déployer** :
   - Allez sur Railway → Votre projet → Service "Mascot"
   - Onglet "Deployments"
   - Vous verrez un nouveau déploiement en cours

4. **Attendez que le déploiement soit terminé** (1-2 minutes)

5. **Réessayez de créer le compte** depuis la console du navigateur

---

## 🔄 Alternative : Utiliser une extension pour désactiver CORS temporairement

Si vous ne pouvez pas pousser vers GitHub maintenant :

1. **Installez une extension Chrome** pour désactiver CORS :
   - "CORS Unblock" ou "Allow CORS"
   - Activez-la
   - Réessayez le code JavaScript dans la console

2. **OU utilisez Postman/Insomnia** (pas de problème CORS) :
   - Méthode : POST
   - URL : `https://mascot-production.up.railway.app/api/v1/auth/register`
   - Headers : `Content-Type: application/json`
   - Body :
   ```json
   {
     "email": "test-1234567890@mascot.app",
     "password": "Test123!",
     "name": "Test User"
   }
   ```

---

**Quelle option préférez-vous ? Pousser vers GitHub ou utiliser une extension/Postman ?**
