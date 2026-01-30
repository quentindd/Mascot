# Mettre à jour le projet (local + Railway)

## 1. Mettre à jour en local

Depuis la racine du projet (`/Users/quentin/Documents/Mascot`) :

```bash
# Récupérer les dernières modifications (si le code est sur GitHub)
git pull origin main

# Backend : installer les deps et vérifier que tout compile
cd backend
npm install
npm run build

# Plugin Figma : installer les deps et rebuild l’UI
cd ../figma-plugin
npm install
npm run build
```

Pour **tester le backend en local** (avec Docker pour Postgres + Redis) :

```bash
cd backend
docker-compose up -d
npm run start:dev
```

---

## 2. Mettre à jour sur Railway

Railway redéploie le **backend** à chaque push sur la branche connectée (souvent `main`).

### Option A : Déploiement automatique (recommandé)

1. **Commiter et pousser** ton code :

   ```bash
   cd /Users/quentin/Documents/Mascot

   git status
   git add .
   git commit -m "Description des changements (ex: Poses Nano Banana, Gallery Poses)"
   git push origin main
   ```

2. **Railway** détecte le push et lance un nouveau build + déploiement.

3. Vérifier sur [railway.app](https://railway.app) : ton projet → onglet **Deployments** → le dernier déploiement doit être en cours puis « Success ».

### Option B : Redéploiement manuel

Si le déploiement auto ne se déclenche pas ou si tu veux redéployer sans nouveau commit :

1. Ouvre ton projet sur [railway.app](https://railway.app).
2. Ouvre le **service backend**.
3. Onglet **Deployments** → sur le dernier déploiement, clic sur **⋮** (trois points) → **Redeploy**.

---

## 3. Variables d’environnement Railway

Après un déploiement, vérifier que les variables nécessaires sont bien définies pour le backend (Settings → Variables) :

- `REPLICATE_API_TOKEN` — pour poses (Nano Banana), animations (Veo), rembg
- `REDIS_URL` — pour les jobs (poses, animations, etc.)
- `DATABASE_URL` — fourni par le plugin PostgreSQL Railway
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — stockage (images, vidéos)
- (Optionnel) `REPLICATE_POSE_MODEL` — non utilisé pour les poses (on utilise Nano Banana) ; tu peux le laisser ou le retirer.

Si tu en ajoutes ou modifies, Railway redémarre le service après sauvegarde.

---

## 4. Récapitulatif rapide

| Où        | Action |
|----------|--------|
| **Local** | `git pull` → `cd backend && npm install && npm run build` → `cd figma-plugin && npm install && npm run build` |
| **Railway** | `git add . && git commit -m "..." && git push origin main` → attendre le déploiement auto (ou redéployer à la main) |
| **Plugin Figma** | Recharger le plugin dans Figma (Développement → Recharger le plugin) après un `npm run build` dans `figma-plugin` |

Si tu vois encore l’ancien comportement (ex. Flux Kontext pour les poses), c’est en général que le backend tourne encore sur l’ancienne version : vérifier que le dernier déploiement Railway est bien terminé et que l’URL utilisée par le plugin pointe bien vers ce projet Railway.
