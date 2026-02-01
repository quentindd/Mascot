# Configuration Stripe (achat de crédits) — mode live

Le backend et le plugin sont prêts. On configure Stripe **directement en production** pour accepter de vrais paiements (vraie carte).

## 1. Compte Stripe et activation

1. Créer un compte sur [stripe.com](https://stripe.com).
2. **Activer le compte en mode Live** : dans le Dashboard Stripe, suivre les étapes d’activation (identité, infos bancaires, etc.) pour pouvoir accepter des paiements réels. Tant que ce n’est pas fait, seules les clés **Test** sont disponibles.
3. Une fois activé, passer en **mode Live** (toggle « Test mode » désactivé en haut à droite du Dashboard).

## 2. Clés API (Live)

1. Dans Stripe : **Developers** → **API keys**.
2. S’assurer d’être en **mode Live** (pas « Test mode »).
3. Récupérer la **Secret key** (sk_live_…). C’est celle-ci qui sera utilisée sur Railway.

## 3. Webhook (Live)

1. Toujours en **mode Live** : **Developers** → **Webhooks** → **Add endpoint**.
2. **URL** : `https://mascot-production.up.railway.app/api/v1/billing/webhook`  
   (adapter si ton backend a une autre URL).
3. **Events to send** : choisir **Select events** et cocher `checkout.session.completed`.
4. Créer l’endpoint, puis cliquer dessus et révéler le **Signing secret** (whsec_…). Ce secret sert à vérifier que les événements viennent bien de Stripe.

## 4. Variables d’environnement Railway

Dans le projet Railway → service backend → **Settings** → **Variables**, ajouter :

| Variable | Valeur |
|----------|--------|
| `STRIPE_SECRET_KEY` | Ta clé secrète **Live** (sk_live_…) |
| `STRIPE_WEBHOOK_SECRET` | Le signing secret du webhook **Live** (whsec_…) |

Optionnel (URLs de redirection après paiement) :

| Variable | Exemple |
|----------|---------|
| `FRONTEND_URL` ou `APP_URL` | `https://mascot-production.up.railway.app` |

Sauvegarder : Railway redémarre le service.

## 5. Packs de crédits (côté code)

Définis dans le backend en **USD** :

- **25** crédits → 5,99 $  
- **75** crédits → 12,99 $  
- **200** crédits → 25,99 $  

Aucun produit à créer dans Stripe : le backend utilise Checkout avec `price_data` (paiement unique en USD).

## 6. Vérification avec une vraie carte

1. Backend déployé sur Railway avec les variables ci-dessus.
2. Plugin Figma rebuild et rechargé (onglet **Account**).
3. Se connecter, choisir un pack, cliquer sur **Buy more credits** : la page Stripe Checkout s’ouvre.
4. Payer avec une **vraie carte** : le montant sera débité (petit montant pour tester, ex. 5,99 $).
5. Après paiement, Stripe envoie l’événement au webhook → le backend ajoute les crédits. Rafraîchir la balance dans le plugin (ou recharger l’onglet).

**Important** : avec les clés **Live**, tous les paiements sont réels. Pour limiter les tests, tu peux faire un premier achat du plus petit pack (25 cr – 5,99 $) puis vérifier que les crédits apparaissent bien.
