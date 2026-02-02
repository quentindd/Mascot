# Checklist avant d’envoyer la version finale à Figma (publication)

## 1. Manifest et build

- [x] **documentAccess: "dynamic-page"** — Ajouté dans `manifest.json` (obligatoire pour les nouveaux plugins).
- [ ] **Build à jour** — Exécuter `npm run build` dans `figma-plugin` avant toute soumission.
- [ ] **Fichiers générés** — Vérifier que `code.js`, `ui.html` et `ui.js` sont bien présents après le build.

## 2. Contenu pour la fiche Community (Submit to Community)

Lors de la soumission dans Figma, tu devras remplir :

- [ ] **Nom** — Ex. « Mascot » (déjà dans le manifest).
- [ ] **Description** — Courte description pour la page Community (ce que fait le plugin, pour qui, etc.).
- [ ] **Icône** — Image carrée pour le plugin (recommandé : 128×128 ou 256×256 px, PNG).
- [ ] **Captures d’écran / vidéo** — Optionnel mais recommandé pour la modération et les utilisateurs.

## 3. Conformité et bonnes pratiques Figma

- [ ] **Réseau** — Le plugin n’accède qu’aux domaines déclarés dans `networkAccess.allowedDomains` (backend Railway, Supabase).
- [ ] **Pas de sélection requise** — Le plugin fonctionne sans sélection obligatoire (génération, insertion).
- [ ] **Gestion hors ligne** — Si l’utilisateur est déconnecté, les appels API échouent ; s’assurer que les messages d’erreur sont clairs.
- [ ] **Taille du bundle** — Build en mode production (Vite) pour limiter la taille des fichiers.

## 4. Tests avant envoi

- [ ] **Connexion** — Connexion Google OAuth et chargement du token.
- [ ] **Création de mascot** — Génération d’un mascot, apparition dans la Gallery.
- [ ] **Custom (poses)** — Génération d’une pose, insertion dans Figma.
- [ ] **Animations** — Génération d’une animation, téléchargement / insertion.
- [ ] **Account** — Affichage des crédits, achat Stripe (test ou prod selon ton choix).
- [ ] **Reload** — Recharger le plugin dans Figma après un build et vérifier qu’il démarre sans erreur.

## 5. Backend et production

- [ ] **API en production** — L’URL dans `figma-plugin/src/api/client.ts` pointe vers ton backend (ex. Railway).
- [ ] **Stripe** — Webhook configuré (`STRIPE_WEBHOOK_SECRET`), URL du webhook : `https://<ton-backend>/api/v1/billing/webhook`.
- [ ] **Variables d’environnement** — Toutes les variables nécessaires sont définies sur Railway (ou ton hébergeur).

## 6. Publication dans Figma

1. **Figma Desktop** (pas le navigateur).
2. **Plugins** → **Development** → **Mascot** (ou importer `manifest.json` si besoin).
3. Menu (⋯) du plugin → **Publish** ou **Submit to Community**.
4. Remplir la fiche (nom, description, icône, etc.) et envoyer.
5. Pour la **Community** : modération Figma ; tu seras notifié du statut.

## 7. Optionnel mais utile

- **Politique de confidentialité** — Lien vers une page (ex. `/api/v1/legal/privacy`) si tu collectes des données (OAuth, paiements).
- **Conditions d’utilisation** — Lien vers tes CGU si tu en as.
- **Support** — Email ou lien de contact pour les utilisateurs.

---

**Résumé** : Build à jour, `documentAccess` dans le manifest, icône + description pour la fiche, tests des flux principaux, backend et Stripe en prod, puis **Submit to Community** (ou Publish) depuis Figma Desktop.
