# Configuration Stripe — Abonnements Mascoty

Ce document indique **exactement** quoi saisir dans Stripe et dans Railway (ou `.env`).

---

## 1. Stripe Dashboard — Créer les 3 produits et prix

### 1.1 Accès

1. Va sur [https://dashboard.stripe.com](https://dashboard.stripe.com).
2. Connecte-toi (ou crée un compte).
3. **Mode test** : en haut à droite, laisse **« Mode test »** activé pour les tests. Pour la prod, tu passeras en mode live et tu recréeras les 3 produits en live.

---

### 1.2 Produit 1 — Basic

1. Menu **Produits** (Products) → **+ Ajouter un produit**.
2. Renseigne :

   | Champ | Valeur exacte à saisir |
   |-------|------------------------|
   | **Nom** | `Mascoty Basic` |
   | **Description** | `30 credits per month for mascot and poses.` |
   | **Image** | (optionnel) |

3. Section **Prix** :
   - Clique **+ Ajouter un autre prix** (ou « Add a price »).
   - Renseigne :

   | Champ | Valeur exacte |
   |-------|----------------|
   | **Prix** | `4.99` |
   | **Devise** | `USD` ($) |
   | **Type de facturation** | **Récurrent** (Recurring) |
   | **Intervalle** | **Mensuel** (Monthly) |

4. Clique **Enregistre** (Save product).

5. **Où trouver l’ID du prix (`price_...`)** → voir la section **« Où trouver le Price ID »** juste en dessous (section 1.5).

---

### 1.5 Où trouver le Price ID (`price_...`)

L’ID du prix **n’est pas** affiché en gros sur la page. Voici **exactement** où le trouver :

**Méthode 1 — Depuis la page du produit (le plus simple)**  
1. Va dans **Produits** (Products) dans le menu de gauche.  
2. Clique sur le **nom du produit** (ex. « Mascoty Basic ») pour ouvrir sa fiche.  
3. Sur la fiche produit, descends jusqu’à la section **« Tarification »** / **« Pricing »**.  
4. Tu vois une ligne par prix (ex. « $4.99 / month »). **Clique sur cette ligne** (sur le montant ou sur la ligne).  
5. Soit l’ID s’affiche dans un panneau à droite (une chaîne du type `price_1ABC...`), soit il est dans **l’URL du navigateur** :  
   - L’URL ressemble à :  
     `https://dashboard.stripe.com/test/prices/price_1QHjKpLmNOPQRstuvwxyz`  
   - La partie qui commence par **`price_`** jusqu’à la fin (sans slash) est ton Price ID.  
   - Exemple : `price_1QHjKpLmNOPQRstuvwxyz` → copie tout ça.

**Méthode 2 — Depuis le menu Développeurs**  
1. Menu **Développeurs** (Developers) → **API** (ou « Logs » / « Webhooks » selon la version).  
2. Onglet **Objets** ou **Explorer** : tu peux chercher « Prices » et voir la liste des prix avec leur ID (colonne **ID** ou en cliquant sur un prix).

En résumé : **Ouvre le produit → section Tarification / Pricing → clique sur le prix → regarde l’URL ou le panneau de détail ; l’ID est la valeur qui commence par `price_`.** Copie-la telle quelle (sans espace avant/après) dans `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO` ou `STRIPE_PRICE_MAX`.

---

### 1.3 Produit 2 — Pro

1. **Produits** → **+ Ajouter un produit**.
2. Renseigne :

   | Champ | Valeur exacte à saisir |
   |-------|------------------------|
   | **Nom** | `Mascoty Pro` |
   | **Description** | `65 credits per month for mascot and poses.` |

3. Section **Prix** :

   | Champ | Valeur exacte |
   |-------|----------------|
   | **Prix** | `7.99` |
   | **Devise** | `USD` |
   | **Type de facturation** | **Récurrent** (Recurring) |
   | **Intervalle** | **Mensuel** (Monthly) |

4. Enregistre.
5. **Copie l’ID du prix** : même procédure que section **1.5** (Produits → cliquer sur « Mascoty Pro » → Tarification → cliquer sur le prix → ID dans l’URL ou le panneau). → `STRIPE_PRICE_PRO`.

---

### 1.4 Produit 3 — Max

1. **Produits** → **+ Ajouter un produit**.
2. Renseigne :

   | Champ | Valeur exacte à saisir |
   |-------|------------------------|
   | **Nom** | `Mascoty Max` |
   | **Description** | `100 credits per month for mascot and poses.` |

3. Section **Prix** :

   | Champ | Valeur exacte |
   |-------|----------------|
   | **Prix** | `9.99` |
   | **Devise** | `USD` |
   | **Type de facturation** | **Récurrent** (Recurring) |
   | **Intervalle** | **Mensuel** (Monthly) |

4. Enregistre.
5. **Copie l’ID du prix** : même procédure que section **1.5** (Produits → « Mascoty Max » → Tarification → cliquer sur le prix). → `STRIPE_PRICE_MAX`.

---

## 2. Stripe — Clés API

1. Menu **Développeurs** (Developers) → **Clés API** (API keys).
2. En **Mode test** :
   - **Clé secrète** : commence par `sk_test_...`. Copie-la → `STRIPE_SECRET_KEY`.
3. En **Mode live** (prod) : utilise la clé secrète live `sk_live_...` pour `STRIPE_SECRET_KEY`.

---

## 3. Stripe — Webhook

1. **Développeurs** → **Webhooks** → **+ Ajouter un endpoint** (Add endpoint).
2. **URL de l’endpoint** :  
   Remplace par l’URL réelle de ton backend :

   - **Local (test avec Stripe CLI)** : tu utiliseras l’URL fournie par `stripe listen` (ex. `https://xxx.localhost.run`).
   - **Railway (prod)** :  
     `https://TON-SERVICE.railway.app/api/v1/billing/webhook`  
     Exemple si ton projet s’appelle mascoty-backend :  
     `https://mascoty-production.up.railway.app/api/v1/billing/webhook`

   À saisir exactement (avec ton domaine Railway) :

   ```
   https://mascoty-production.up.railway.app/api/v1/billing/webhook
   ```

   (Adapte si ton URL Railway est différente : pas d’espace, pas de slash final après `webhook`.)

3. **Événements à écouter** : choisis **Sélectionner des événements** et coche **exactement** :

   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.paid`

4. Enregistre.
5. **Signing secret** : sur la page du webhook, section « Signing secret », clique **Révéler** et copie la valeur (ex. `whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

---

## 4. Ce que tu dois rentrer dans Railway (ou `.env`)

### 4.1 Variables obligatoires Stripe

Dans **Railway** : ton service backend → **Variables** → ajoute ou modifie :

| Nom de la variable | Valeur à coller | Exemple |
|--------------------|-----------------|--------|
| `STRIPE_SECRET_KEY` | Ta clé secrète Stripe (test ou live) | `sk_test_51ABC...` ou `sk_live_51ABC...` |
| `STRIPE_WEBHOOK_SECRET` | Le signing secret du webhook | `whsec_xxxxxxxxxxxxxxxx` |
| `STRIPE_PRICE_BASIC` | L’ID du prix Basic (récurrent 4,99 $/mois) | `price_1QHjKpLmN...` |
| `STRIPE_PRICE_PRO` | L’ID du prix Pro (récurrent 7,99 $/mois) | `price_1QHjKqLmN...` |
| `STRIPE_PRICE_MAX` | L’ID du prix Max (récurrent 9,99 $/mois) | `price_1QHjKrLmN...` |

- **Pas d’espaces** avant/après le `=`, pas de guillemets autour de la valeur dans Railway (sauf si la valeur contient des espaces).
- Les **Price ID** doivent correspondre à des prix **récurrents mensuels en USD** pour les montants 4,99 / 7,99 / 9,99 $.

### 4.2 Récap format

En local (fichier `.env` à la racine de `backend/`) :

```env
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_WEBHOOK_SECRET=whsec_abcdef123456...
STRIPE_PRICE_BASIC=price_1QHjKpLmN...
STRIPE_PRICE_PRO=price_1QHjKqLmN...
STRIPE_PRICE_MAX=price_1QHjKrLmN...
```

Sur **Railway** : mêmes noms, mêmes valeurs, une variable par ligne dans l’éditeur de variables.

---

## 5. Vérifications rapides

| Vérification | Où |
|--------------|-----|
| Les 3 prix sont bien **Recurring** et **Monthly** | Stripe → Produits → chaque produit → onglet Prix |
| Les montants sont **4.99**, **7.99**, **9.99** en **USD** | Idem |
| L’URL du webhook est celle de ton backend + `/api/v1/billing/webhook` | Stripe → Webhooks |
| Les 3 événements sont cochés : `checkout.session.completed`, `customer.subscription.deleted`, `invoice.paid` | Stripe → Webhooks → ton endpoint |
| Les 5 variables Stripe sont définies dans Railway (ou `.env`) | Railway → Variables / fichier `.env` |

---

## 6. Une seule URL backend (plugin + Stripe)

**Important** : le plugin Figma et le webhook Stripe doivent appeler **exactement le même backend** (même URL Railway).

- **URL webhook Stripe** (section 3) = `https://TON-SERVICE.up.railway.app/api/v1/billing/webhook`
- **URL API du plugin** = la même base : `https://TON-SERVICE.up.railway.app/api/v1`  
  (définie dans le plugin via `VITE_API_URL` au build, ou par défaut dans `figma-plugin/src/config.ts`)

Si le webhook pointe vers un backend (ex. `mascot-production`) et le plugin vers un autre (ex. `mascoty-production`), les crédits sont enregistrés sur le premier et l’onglet Account affiche le solde du second → **tu ne vois pas les crédits**. Corrige en utilisant une seule URL partout.

---

## 7. Test rapide

1. Redéploie le backend sur Railway après avoir ajouté les variables.
2. Dans le plugin Figma : onglet Account → choisis un plan (ex. Pro) → **Subscribe**.
3. Tu dois être redirigé vers Stripe Checkout ; paie avec la carte test `4242 4242 4242 4242`.
4. Après paiement, ton compte doit recevoir les crédits du plan (ex. 65 pour Pro). Vérifie le solde dans le plugin et, côté backend, les logs du webhook `invoice.paid`.

Si les crédits ne sont pas ajoutés :
- Vérifie que **l’URL du plugin** et **l’URL du webhook Stripe** sont la même base (section 6).
- Vérifie les logs Railway (erreur webhook, signature, ou variable manquante) et que `STRIPE_WEBHOOK_SECRET` correspond bien au webhook (même environnement test/live que la clé).
- Si le plugin affiche une erreur CORS sur `/api/v1/credits/balance`, redéploie le backend (les en-têtes CORS ont été renforcés).
