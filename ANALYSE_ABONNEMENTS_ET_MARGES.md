# Analyse abonnements & marges — Mascoty

Document préparatoire avant toute modification du code. Données actuelles + scénario abonnements (USD, prix de départ 4,99 $).

---

## 1. Règles crédits (actuelles vs souhaitées)

| Élément | Actuel (code) | Souhaité |
|--------|----------------|----------|
| **Crédits nouveau user** | 15 | **5** |
| **Coût mascot (3 variations)** | 1 crédit | 1 crédit |
| **Coût pose** | 5 crédits | **4 crédits** |
| **Coût animation** | 20 crédits | 20 crédits (inchangé) |

Avec 5 crédits : 1 mascot (1 cr) + 1 pose (4 cr) = 5 cr → un essai mascot + une pose par nouveau user.

---

## 2. Offre actuelle (achat de crédits, USD)

| Pack | Prix (USD) | Crédits | Prix/crédit (USD) |
|------|------------|---------|-------------------|
| 20   | 1,99       | 20      | 0,0995            |
| 50   | 4,99       | 50      | 0,0998            |
| 100  | 8,99       | 100     | 0,0899            |

Mode Stripe actuel : **payment** (one-time), currency **usd**.

---

## 3. Nouvelle offre : abonnements (USD)

Prix de départ **4,99 $**, puis progression en prix et en crédits.

| Plan     | Prix (USD) | Crédits / mois | Prix par crédit (USD) | Remarque              |
|----------|------------|----------------|------------------------|------------------------|
| **Basic** | 4,99      | 30             | 0,166                  | Entrée de gamme        |
| **Pro**   | 7,99      | 65             | 0,123                  | Meilleur rapport $/cr |
| **Max**   | 9,99      | 100            | 0,100                  | Prix plancher ~0,10 $/cr |

Comparaison valeur :
- Basic → Pro : +3 $/mois pour +35 cr → même prix/crédit qu’environ 2× Basic.
- Pro → Max : +2 $/mois pour +35 cr → incitatif fort à passer au Max.

---

## 4. Frais Stripe (USD)

Fees typiques **Stripe US** : **2,9 % + 0,30 $** par transaction (paiement récurrent mensuel).

| Plan   | Prix TTC (USD) | Frais Stripe (2,9 % + 0,30 $) | **Net après Stripe (USD)** |
|--------|----------------|--------------------------------|-----------------------------|
| Basic  | 4,99           | 0,14 + 0,30 ≈ **0,44**         | **≈ 4,55**                  |
| Pro    | 7,99           | 0,23 + 0,30 ≈ **0,53**         | **≈ 7,46**                  |
| Max    | 9,99           | 0,29 + 0,30 ≈ **0,59**         | **≈ 9,40**                  |

En % du prix : Basic ~8,8 %, Pro ~6,6 %, Max ~5,9 %.

---

## 5. Coûts backend (estimation par action)

Sources dans le code :
- **Mascot** : Gemini (Vertex) image gen × 3 variations + Replicate rembg-enhance × 3.
- **Pose** : Replicate Nano Banana (edit) + rembg (Replicate ou local).
- **Animation** : Replicate Veo 3.1 Fast — commentaire dans le code : ~0,4 ¢/vidéo.

Estimations (ordre de grandeur, à ajuster avec tes facturations réelles) :

| Action | Crédits facturés | Coût estimé (USD) | Coût estimé (EUR) |
|--------|-------------------|--------------------|--------------------|
| **1 mascot** (3 variations) | 1 | Gemini ~0,04×3 + rembg ~0,01×3 → **~0,15** | **~0,14** |
| **1 pose** | 4 | Nano Banana + rembg → **~0,03–0,05** | **~0,03–0,05** |
| **1 animation** | 20 | Veo ~0,004 → **~0,004** | **~0,004** |

Équivalent **coût par crédit** (si tout en mascots/poses, sans animation) :
- Mascot : 0,14 € / 1 cr = **0,14 €/cr**.
- Pose : 0,04 € / 4 cr = **0,01 €/cr**.
- Mix 50 % mascots / 50 % poses (en crédits) : (0,14×1 + 0,04×4) / (1+4) ≈ **0,06 €/cr** (moyenne indicative).

Pour les calculs de marge ci‑dessous, on utilise une **fourchette de coût moyen** : **0,02–0,06 $/crédit** selon usage (plus de mascots = plus cher par crédit).

---

## 6. Marges par plan (après Stripe, après coût crédits)

Hypothèse : **coût moyen = 0,04 $/crédit** (milieu de fourchette). Crédits : 30 / 65 / 100.

| Plan   | Net après Stripe (USD) | Coût crédits (30/65/100 × 0,04 $) | **Marge brute (USD)** | Marge (%) |
|--------|-------------------------|------------------------------------|------------------------|-----------|
| Basic  | 4,55                    | 1,20                               | **3,35**               | ~67 %     |
| Pro    | 7,46                    | 2,60                               | **4,86**               | ~61 %     |
| Max    | 9,40                    | 4,00                               | **5,40**               | ~54 %     |

Si coût = **0,06 $/cr** (usage très “mascot”) :

| Plan   | Net Stripe | Coût cr | **Marge brute** | Marge (%) |
|--------|------------|---------|------------------|-----------|
| Basic  | 4,55       | 1,80    | **2,75**         | ~55 %     |
| Pro    | 7,46       | 3,90    | **3,56**         | ~45 %     |
| Max    | 9,40       | 6,00    | **3,40**         | ~34 %     |

Si coût = **0,02 $/cr** (usage plutôt poses) :

| Plan   | Net Stripe | Coût cr | **Marge brute** | Marge (%) |
|--------|------------|---------|------------------|-----------|
| Basic  | 4,55       | 0,60    | **3,95**         | ~79 %     |
| Pro    | 7,46       | 1,30    | **6,16**         | ~77 %     |
| Max    | 9,40       | 2,00    | **7,40**         | ~74 %     |

---

## 7. Synthèse utile avant de coder

| Donnée | Valeur |
|--------|--------|
| **Crédits nouveau user** | 5 |
| **Coût mascot** | 1 crédit |
| **Coût pose** | 4 crédits |
| **Coût animation** | 20 crédits (inchangé) |
| **Devise abonnements** | USD |
| **Plans** | Basic 4,99 $ / 30 cr, Pro 7,99 $ / 65 cr, Max 9,99 $ / 100 cr |
| **Type Stripe** | Subscription (récurrent), pas one-time payment |
| **Reset des crédits** | Mensuel (à la date de renouvellement) |
| **Stripe fees (US)** | 2,9 % + 0,30 $ par transaction |
| **Marge brute (estimation)** | ~50–80 % selon mix mascots/poses (coût 0,02–0,06 $/cr) |

---

## 8. Points à trancher avant implémentation

1. **Reset des crédits** : chaque mois à date anniversaire (subscription) ; crédits non consommés perdus ou report partiel (à définir).
2. **Stripe** : créer des **Products** + **Prices** récurrents (monthly) en **USD** pour Basic (4,99 $), Pro (7,99 $), Max (9,99 $). Dans le Dashboard Stripe : Products → Add product (ex. "Mascoty Basic") → Add price → Recurring, $4.99/month → copier l’ID du Price (price_xxx). Répéter pour Pro et Max. Définir les variables d’environnement : `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_MAX`. Webhook : activer les événements `invoice.paid`, `customer.subscription.deleted`, `checkout.session.completed`.
3. **Webhook** : gérer `customer.subscription.created`, `updated`, `deleted` et `invoice.paid` pour attribuer les crédits et mettre à jour `stripeSubscriptionId` / `stripeSubscriptionMetadata`.
4. **Compatibilité** : utilisateurs avec ancien système “packs à l’achat” : garder les crédits existants, proposer uniquement abonnements pour les nouveaux achats (ou migration à définir).
5. **Pose : 4 vs 5** : dans le code, `poses.service` utilise actuellement **5** crédits ; à aligner sur **4** si tu valides ce choix.

Dès que ces points sont validés, on peut détailler les changements (backend + plugin) sans modifier la logique métier avant d’avoir ce tableau sous les yeux.
