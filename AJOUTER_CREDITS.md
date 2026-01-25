# Comment obtenir plus de crédits

## 🚀 Option 1 : Créer un nouveau compte (RAPIDE)

Chaque nouveau compte commence avec **1 crédit gratuit**.

### Via Terminal :

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau-compte@mascot.app",
    "password": "MotDePasse123!",
    "name": "Nouveau User"
  }'
```

**Dans la réponse**, copiez le `accessToken` et utilisez-le dans le plugin.

---

## 🔧 Option 2 : Ajouter des crédits à votre compte actuel

### Méthode A : Via SQL (direct dans la base de données)

Si vous avez accès à la base de données Railway :

1. Allez sur Railway → Projet "Mascot" → Service PostgreSQL
2. Cliquez sur "Query" ou "Connect"
3. Exécutez cette requête SQL :

```sql
-- Trouver votre user ID (remplacez l'email)
SELECT id, email, credit_balance FROM users WHERE email = 'votre-email@example.com';

-- Ajouter 10 crédits (remplacez l'ID)
UPDATE users 
SET credit_balance = credit_balance + 10 
WHERE id = 'votre-user-id-ici';
```

### Méthode B : Via un script Node.js (si vous avez accès au backend)

Créez un fichier `add-credits.js` :

```javascript
// Nécessite d'être exécuté dans le contexte du backend
const { AppModule } = require('./dist/app.module');
const { NestFactory } = require('@nestjs/core');

async function addCredits() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const creditsService = app.get('CreditsService');
  const userRepository = app.get('UserRepository');
  
  // Trouver l'utilisateur par email
  const user = await userRepository.findOne({ 
    where: { email: 'votre-email@example.com' } 
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  // Ajouter 10 crédits
  await creditsService.addCredits(user.id, 10, 'Crédits ajoutés manuellement');
  console.log(`✅ Ajouté 10 crédits. Nouveau solde: ${user.creditBalance + 10}`);
  
  await app.close();
}

addCredits();
```

---

## 💡 Solution la plus simple

**Créer un nouveau compte** est la solution la plus rapide :

1. Exécutez la commande curl ci-dessus
2. Copiez le `accessToken`
3. Utilisez-le dans le plugin Figma

Chaque nouveau compte = 1 crédit = 1 génération (4 variations) !

---

## 📊 Combien de crédits pour tester ?

- **1 crédit** = 1 génération = **4 variations** de mascot
- Donc 1 compte = 4 mascots différents à tester

Si vous voulez tester plus, créez plusieurs comptes avec des emails différents.

---

**Quelle option préférez-vous ? Créer un nouveau compte ou ajouter des crédits à l'existant ?**
