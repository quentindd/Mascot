# Stripe — checklist

Oui, le code est prêt pour Stripe. Il reste à configurer les variables et le webhook.

## 1. Variables d’environnement (Railway / .env)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe : `sk_test_...` (test) ou `sk_live_...` (prod) |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook : `whsec_...` (voir ci‑dessous) |

Les anciennes variables `STRIPE_PRICE_ID_*` ne sont pas utilisées (checkout avec `price_data`).

## 2. Webhook Stripe

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. **URL** : `https://<ton-backend>/api/v1/billing/webhook`  
   (ex. `https://mascot-production.up.railway.app/api/v1/billing/webhook`)
3. **Events** : cocher `checkout.session.completed`.
4. Créer l’endpoint, puis copier le **Signing secret** (`whsec_...`) dans `STRIPE_WEBHOOK_SECRET`.

## 3. Ce que fait le code

- **Checkout** : `POST /api/v1/billing/checkout` (auth JWT) avec `{ "plan": "20" | "50" | "100" }` → crée une session Stripe (20/50/100 cr à 1,99 $ / 4,99 $ / 8,99 $) et renvoie `{ checkoutUrl }`.
- **Webhook** : Stripe envoie `checkout.session.completed` → le backend lit `metadata.userId` et `metadata.credits`, puis ajoute les crédits (avec `referenceId` = session id pour éviter le double crédit en cas de retry).

## 4. Test rapide

1. Mettre `STRIPE_SECRET_KEY` (mode test) et `STRIPE_WEBHOOK_SECRET`.
2. Dans le plugin : acheter des crédits (ex. pack 50).
3. Payer avec la carte test `4242 4242 4242 4242`.
4. Vérifier que le solde de crédits augmente après redirection.

Si le solde n’augmente pas : vérifier que l’URL du webhook est bien celle du backend en prod et que les logs Stripe (Dashboard → Webhooks → ton endpoint) ne montrent pas d’erreur.
