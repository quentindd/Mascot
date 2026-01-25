# 🔐 Créer un compte depuis votre navigateur

Puisque le service Railway est accessible depuis votre navigateur, créons le compte directement !

## Méthode 1 : Via la console du navigateur (RAPIDE)

1. **Ouvrez la console** de votre navigateur (F12 ou Cmd+Option+I)
2. **Collez ce code** et appuyez sur Entrée :

```javascript
(async () => {
  const timestamp = Date.now();
  const email = `test-${timestamp}@mascot.app`;
  const password = 'TestMascot123!';
  
  console.log('🔐 Création du compte...');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('');
  
  try {
    const response = await fetch('https://mascot-production.up.railway.app/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        name: `Test User ${timestamp}`
      })
    });
    
    const data = await response.json();
    
    if (data.accessToken) {
      console.log('✅ Compte créé !');
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔑 TOKEN API (copiez-le)');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log(data.accessToken);
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('💡 Collez ce token dans le plugin Figma !');
      
      // Copier dans le presse-papier (si possible)
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.accessToken).then(() => {
          console.log('📋 Token copié dans le presse-papier !');
        });
      }
    } else {
      console.log('❌ Erreur:', data);
    }
  } catch (error) {
    console.log('❌ Erreur:', error);
  }
})();
```

3. **Copiez le token** qui s'affiche dans la console
4. **Utilisez-le dans le plugin Figma**

---

## Méthode 2 : Via curl dans votre terminal local

Si vous préférez utiliser curl depuis votre Mac :

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@mascot.app",
    "password": "Test123!",
    "name": "Test User"
  }'
```

**Copiez le `accessToken` de la réponse.**

---

## Méthode 3 : Via Postman ou Insomnia

1. **Méthode** : POST
2. **URL** : `https://mascot-production.up.railway.app/api/v1/auth/register`
3. **Headers** : `Content-Type: application/json`
4. **Body** (JSON) :
```json
{
  "email": "test-1234567890@mascot.app",
  "password": "Test123!",
  "name": "Test User"
}
```

---

## ✅ Une fois le token obtenu

1. **Ouvrez Figma**
2. **Chargez le plugin Mascot**
3. **Collez le token** dans le champ "API Token"
4. **Cliquez sur "Sign In"**

✅ Vous êtes connecté en production !

---

**Quelle méthode préférez-vous ? La méthode 1 (console navigateur) est la plus rapide !**
