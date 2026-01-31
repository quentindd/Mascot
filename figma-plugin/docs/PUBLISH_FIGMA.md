# Publier le plugin sur Figma

Il n’y a pas de commande « push » automatique vers Figma. La mise à jour / publication se fait **depuis l’app Figma**.

## 1. Build du plugin (avant chaque publication)

```bash
cd figma-plugin
npm run build
```

Cela génère `code.js` et `ui.html` dans le dossier du plugin.

## 2. Charger en développement (tester en local)

1. Ouvrir **Figma Desktop** (pas le navigateur).
2. Ouvrir ou créer un fichier.
3. **Plugins** → **Development** → **Import plugin from manifest…**
4. Choisir le fichier `figma-plugin/manifest.json` (dans le dossier du projet).
5. Le plugin apparaît dans **Plugins** → **Development** → **Mascot**. Cliquer pour l’ouvrir.

Après chaque `npm run build`, dans Figma : clic droit sur le panneau du plugin → **Reload** pour voir les changements.

## 3. Publier pour les autres (Community ou organisation)

Une fois le plugin chargé en **Development** :

1. Dans Figma : **Plugins** → **Development** → sélectionner **Mascot**.
2. Ouvrir le menu (⋯) ou les options du plugin.
3. Choisir **Publish** ou **Submit to Community** (selon ton type de compte Figma).

Pour une **organisation** : souvent **Publish** → choix du type (privé / équipe / public).

Pour la **Figma Community** : **Submit to Community** → remplir la fiche (nom, description, icône, etc.) et envoyer pour modération.

## 4. Mettre à jour une version déjà publiée

1. Faire les changements dans le code.
2. Lancer `npm run build` dans `figma-plugin`.
3. Dans Figma : **Plugins** → **Development** → ton plugin → **Update** / **Publish new version** (libellé peut varier selon l’interface).

En résumé : **build local** (`npm run build`) puis **publication ou mise à jour manuelle** dans Figma (Development → Publish / Update).
