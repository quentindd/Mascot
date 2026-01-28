# Poses : guide simple

## En 3 phrases

- **Les poses = Replicate uniquement** (modèle `fofr/consistent-character`). Pas de Gemini.
- Tu dois avoir **le même token Replicate** dans ton backend (`.env` / Railway) que celui avec lequel tu te connectes sur replicate.com, sinon tu ne verras pas tes runs.
- Après une génération de pose, le backend écrit dans les logs un **lien direct** vers la run Replicate : ouvre ce lien pour vérifier que c’est bien ton compte.

---

## Backend : c’est déjà fait

Le code backend est prêt : token Replicate, log du lien vers la run, support de `REDIS_URL` (Railway). En local tu mets tout dans `backend/.env`. En prod, tu configures **Railway** (voir ci‑dessous).

---

## Railway + Redis : où aller et quoi ajouter

### 1. Ajouter le token Replicate sur Railway

1. Va sur **https://railway.app** → connecte-toi.
2. Ouvre ton **projet** (celui où tourne le backend Mascot).
3. Clique sur le **service backend** (le service qui exécute ton API NestJS).
4. Onglet **Variables** (ou **Settings** puis **Variables** selon l’interface).
5. Clique sur **+ New Variable** (ou **Add variable**).
6. **Nom** : `REPLICATE_API_TOKEN`  
   **Valeur** : ton token Replicate (celui de https://replicate.com/account/api-tokens, qui commence par `r8_...`).
7. Enregistre. Railway redéploie souvent tout seul ; sinon **Redeploy** le service.

### 2. Ajouter Redis sur Railway (pour que les jobs poses partent)

1. Toujours dans ton **projet** Railway (pas dans le service backend).
2. Clique sur **+ New** (ou **Add service**).
3. Choisis **Database** → **Redis** (ou **Add Redis** / **Redis** dans la liste des plugins).
4. Une fois Redis créé, clique sur le **service Redis**.
5. Onglet **Variables** (ou **Connect**) : tu verras des variables comme `REDIS_URL`, `REDISHOST`, etc.
6. Il faut que ton **service backend** reçoive l’URL Redis. Deux façons :
   - **Option A (recommandée)** : Dans le **service backend** → **Variables** → **+ New Variable** → **Reference variable** (ou “Add reference”). Choisis le **service Redis** puis la variable **`REDIS_URL`**. Railway crée une variable (par ex. `REDIS_URL`) dans le backend avec la valeur de Redis.  
   - **Option B** : Si tu vois une URL Redis en clair (ex. `redis://default:xxx@xxx.railway.internal:6379`), copie-la et dans le **service backend** → **Variables** → ajoute une variable **Nom** : `REDIS_URL`, **Valeur** : cette URL.
7. Redéploie le backend si besoin.

Le backend accepte soit **REDIS_URL** (une seule URL, fournie par Railway quand tu références Redis), soit **REDIS_HOST** + **REDIS_PORT** + **REDIS_PASSWORD** en local.

### Récap Railway

| Où | Quoi |
|----|------|
| **Projet** → **Service backend** → **Variables** | `REPLICATE_API_TOKEN` = ton token `r8_...` |
| **Projet** → **+ New** → **Redis** | Créer un service Redis |
| **Service backend** → **Variables** | Référencer `REDIS_URL` du service Redis (ou coller l’URL à la main) |

---

## Ce que TU dois faire (checklist)

1. **Token Replicate**
   - **Local** : dans `backend/.env` → `REPLICATE_API_TOKEN=r8_xxx...`
   - **Railway** : voir la section « Railway + Redis » ci-dessus → Variables du service backend → `REPLICATE_API_TOKEN`

2. **Redis**
   - **Local** : `brew services start redis` (ou Docker Redis sur 6379) ; dans `backend/.env` tu as déjà `REDIS_HOST=localhost`, etc.
   - **Railway** : ajouter Redis au projet + variable `REDIS_URL` dans le service backend (voir section Railway ci-dessus).

3. **Lancer le backend**
   - Depuis le dossier `backend/` : `npm run start:dev`
   - Dans les logs : `Poses: Replicate configured (model: fofr/consistent-character)` et `[RedisConfig] Redis configuration: ...`

4. **Voir tes runs sur Replicate**
   - Génère une pose depuis le plugin Figma (onglet Poses, mascotte + prompt + Generate)
   - Regarde les **logs du backend** (terminal ou logs Railway)
   - Tu dois voir : `[Replicate] Prediction created: https://replicate.com/p/xxxxx`
   - Ouvre ce lien : la page doit s’ouvrir sur **ton** compte Replicate. Sinon → change le token pour celui de ce compte.

5. **(Optionnel) Changer de modèle**
   - Dans `backend/.env` (ou variable Railway) : `REPLICATE_POSE_MODEL=sdxl-based/consistent-character` (ou autre) puis redémarre / redéploie.

---

## Dépannage rapide

| Problème | À faire |
|----------|--------|
| Je ne vois pas mes runs sur replicate.com | Utilise **exactement** le même token que sur replicate.com dans `REPLICATE_API_TOKEN`. Ouvre le lien logué par le backend après une pose : il doit s’ouvrir sur ton compte. |
| « REPLICATE_API_TOKEN is not set » | Ajoute la variable dans `backend/.env` (local) et dans Railway (prod). |
| La pose reste « generating » | Redis ne tourne pas ou worker pas lancé. Lance Redis et le backend depuis `backend/`. |
| Erreur 500 sur les poses | Regarde les logs backend (ou Railway) pour l’erreur exacte. |

---

## Détails (si tu veux)

- **Modèle utilisé** : `fofr/consistent-character` (configurable via `REPLICATE_POSE_MODEL`).
- **Prérequis** : une mascotte **terminée** avec au moins une image (fullBody, avatar ou squareIcon).
- **Où sont les runs** : sur replicate.com → ton profil (en haut à droite) → Runs / Activity, ou via le lien logué par le backend après chaque création de prédiction.
