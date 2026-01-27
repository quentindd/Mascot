# Dépannage - Feature Poses

## Problème : Route 404 sur `/api/v1/mascots/:id/poses`

### ✅ Vérifications effectuées

1. **Code source** : ✅ Correct
   - Contrôleur créé et configuré
   - Module enregistré dans `AppModule`
   - Routes définies correctement
   - Build réussi

2. **Structure** : ✅ Identique aux autres modules (animations, logos)

3. **Compilation** : ✅ Fichiers générés dans `dist/modules/poses/`

### 🔍 Causes possibles

#### 1. Backend non redéployé (le plus probable)
Le backend en production (`mascot-production.up.railway.app`) n'a pas été redéployé avec le nouveau code.

**Solution** : Redéployer le backend

#### 2. Cache de build
Les fichiers compilés ne sont pas à jour.

**Solution** :
```bash
cd backend
rm -rf dist
npm run build
```

#### 3. Module non chargé
Le module n'est pas correctement importé.

**Vérification** :
```bash
grep -r "PosesModule" backend/src/app.module.ts
```

#### 4. Conflit de routes
Un autre contrôleur capture la route avant.

**Vérification** : Les routes sont correctement ordonnées (routes spécifiques avant routes génériques).

### 🚀 Solutions

#### Solution 1 : Redéployer le backend

**Si Railway est connecté à Git** :
```bash
git add .
git commit -m "Add poses feature"
git push
```

**Si déploiement manuel** :
1. Aller sur Railway dashboard
2. Sélectionner le service backend
3. Cliquer sur "Redeploy"

#### Solution 2 : Vérifier localement

```bash
cd backend
npm run start:dev
```

Puis tester :
- Swagger : `http://localhost:3000/api/docs`
- Vérifier que le tag "poses" apparaît

#### Solution 3 : Vérifier les logs

Au démarrage du backend, chercher dans les logs :
```
PosesController initialized - Routes: POST /mascots/:id/poses, ...
```

Si ce log n'apparaît pas, le module n'est pas chargé.

### 📋 Checklist de vérification

- [ ] Backend redéployé avec le nouveau code
- [ ] Build réussi sans erreurs
- [ ] Module `PosesModule` importé dans `AppModule`
- [ ] Contrôleur `PosesController` enregistré dans `PosesModule`
- [ ] Routes visibles dans Swagger (`/api/docs`)
- [ ] Table `poses` créée dans la base de données
- [ ] Logs de démarrage montrent "PosesController initialized"

### 🔧 Test manuel

```bash
# Test GET (devrait retourner 401 ou 200, pas 404)
curl -X GET https://mascot-production.up.railway.app/api/v1/mascots/TEST_ID/poses \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST (devrait retourner 401 ou 400, pas 404)
curl -X POST https://mascot-production.up.railway.app/api/v1/mascots/TEST_ID/poses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt": "waving"}'
```

### 📞 Si le problème persiste

1. Vérifier les logs du backend en production
2. Vérifier que le code est bien poussé sur la branche principale
3. Vérifier que Railway déploie bien depuis la bonne branche
4. Vérifier les variables d'environnement
