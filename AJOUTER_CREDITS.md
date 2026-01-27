# 💰 Comment ajouter des crédits à votre compte

## Méthode 1 : Via l'API (Recommandé - Simple)

### Étape 1 : Obtenir votre token

Votre token est l'`accessToken` que vous avez reçu lors de la connexion. Vous pouvez le trouver :

1. **Dans la console du plugin Figma** :
   - Ouvrez le plugin
   - Ouvrez la console (F12 ou Cmd+Option+I)
   - Cherchez `[Mascot Code] Token received: eyJhbGciOiJIUzI1NiIs...`
   - Copiez le token complet

2. **Ou depuis la réponse de connexion** :
   - Si vous vous êtes connecté avec Google OAuth, le token était dans la réponse
   - Si vous avez utilisé un token API, c'est celui que vous avez entré

### Étape 2 : Utiliser le script

```bash
cd /Users/quentin/Documents/Mascot
node scripts/add-credits-simple.js <VOTRE_TOKEN> <MONTANT>
```

**Exemple** :
```bash
node scripts/add-credits-simple.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtMTIzNC01Njc4MTIzNDU2NzgifQ.abc123... 100
```

Cela ajoutera 100 crédits à votre compte.

---

## Méthode 2 : Via curl (Alternative)

Si vous préférez utiliser `curl` directement :

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/credits/add \
  -H "Authorization: Bearer <VOTRE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "description": "Added via API"}'
```

---

## Méthode 3 : Via la base de données (Avancé)

Si vous avez accès à la base de données Railway :

1. **Connectez-vous à Railway** et ouvrez votre service PostgreSQL
2. **Ouvrez la console SQL** ou utilisez `psql`
3. **Trouvez votre user ID** :
   ```sql
   SELECT id, email, "creditBalance" FROM users WHERE email = 'votre@email.com';
   ```
4. **Ajoutez des crédits** :
   ```sql
   UPDATE users 
   SET "creditBalance" = "creditBalance" + 100 
   WHERE email = 'votre@email.com';
   ```

---

## Vérifier votre solde

Pour vérifier votre solde actuel :

```bash
curl https://mascot-production.up.railway.app/api/v1/credits/balance \
  -H "Authorization: Bearer <VOTRE_TOKEN>"
```

Ou utilisez le script :
```bash
node scripts/check-balance.js <VOTRE_TOKEN>
```

---

## Notes importantes

- ✅ L'endpoint `/api/v1/credits/add` permet aux utilisateurs d'ajouter des crédits à leur propre compte
- ✅ C'est utile pour les tests et le développement
- ⚠️ En production, vous voudrez peut-être restreindre cet endpoint aux admins uniquement
- ✅ Les crédits sont ajoutés immédiatement et apparaissent dans votre solde

---

## Problème : "Insufficient credits"

Si vous voyez cette erreur, cela signifie que votre solde est à 0. Utilisez une des méthodes ci-dessus pour ajouter des crédits.

---

## Solution automatique (Après redéploiement)

Une fois que le code est déployé sur Railway, les nouveaux utilisateurs Google OAuth recevront automatiquement 100 crédits lors de leur première connexion. Les utilisateurs existants avec 0 crédit recevront également 100 crédits lors de leur prochaine connexion Google OAuth.
