# Compte dev gratuit (sans mettre d’argent)

Tu es le seul dev du projet : tu peux avoir un compte **gratuit** et **ajouter des crédits pour tester** sans payer.

---

## 1. Créer un compte (gratuit, 0 €)

- **Dans le plugin Figma** : « Continue with Figma » (Google) ou « sign in with email » → « Create an account »
- À la création du compte tu reçois **100 crédits** (offerts), aucun paiement demandé

---

## 2. Avoir plus de crédits pour développer (sans payer)

Le backend permet à **tout utilisateur connecté** d’ajouter des crédits à son propre compte (pour les tests). En prod tu pourrais restreindre ça aux admins.

**Avec curl** (remplace `TON_TOKEN` par ton JWT après connexion) :

```bash
curl -X POST https://mascot-production.up.railway.app/api/v1/credits/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_TOKEN" \
  -d '{"amount": 500, "description": "Credits dev"}'
```

**Comment récupérer le token :**

1. Connecte-toi dans le plugin (Figma ou email).
2. Ouvre la console du plugin (Figma → Plugins → Development → Show/Hide Console).
3. Le token est stocké côté plugin ; pour l’avoir en clair tu peux temporairement faire un `console.log` du token après `init-complete`, ou te connecter avec **email + mot de passe** puis appeler le login depuis curl pour récupérer le token :

```bash
# Récupérer un token (email/password)
curl -X POST https://mascot-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ton@email.com","password":"ton_mot_de_passe"}' 
# La réponse contient "accessToken" → utilise-le dans le curl /credits/add ci-dessus
```

Ensuite : `POST /credits/add` avec ce token et `{"amount": 500}` (ou plus) pour te donner des crédits de test.

---

## Résumé

| Besoin | Action |
|--------|--------|
| Compte gratuit | S’inscrire avec email ou « Continue with Figma » → 100 crédits offerts |
| Plus de crédits pour dev | `POST /api/v1/credits/add` avec ton JWT et `{"amount": 500}` (ou autre) |

Aucun paiement n’est nécessaire pour développer et tester.
