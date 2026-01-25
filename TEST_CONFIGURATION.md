# Test de la Configuration Gemini 2.5 Flash Image

## ✅ Configuration terminée

- ✅ Service Account créé
- ✅ Rôle "Utilisateur Vertex AI" ajouté
- ✅ Clé JSON téléchargée
- ✅ Variables Railway configurées

## 🔍 Vérifications

### 1. Vérifier que Railway a redéployé

1. Allez sur Railway → Projet "Mascot"
2. Onglet **"Deployments"** ou **"Logs"**
3. Vérifiez qu'un nouveau déploiement a été déclenché après l'ajout des variables

### 2. Vérifier les logs Railway

Dans les logs de déploiement, cherchez :

**✅ Succès :**
```
[GeminiFlashService] Gemini 2.5 Flash Image service initialized
```

**❌ Erreur possible :**
```
[GeminiFlashService] Failed to initialize Gemini Flash service: ...
```

Si erreur, vérifiez :
- Les variables sont bien nommées (sans fautes de frappe)
- La valeur Base64 est complète (pas tronquée)
- Le Project ID est correct

### 3. Vérifier la facturation Google Cloud

**⚠️ IMPORTANT :** Gemini 2.5 Flash nécessite la facturation activée.

1. Allez sur Google Cloud Console
2. Menu ☰ → **"Facturation"**
3. Vérifiez qu'un compte de facturation est lié à votre projet

Si pas de compte :
- Cliquez sur **"Créer un compte de facturation"**
- Suivez les instructions
- Les $300 de crédits gratuits seront appliqués automatiquement

## 🧪 Test de génération

### Option 1 : Via l'API (curl)

```bash
# Remplacez YOUR_TOKEN par votre token API
curl -X POST https://mascot-production.up.railway.app/api/v1/mascots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Mascot",
    "mascotDetails": "Bird with a bag",
    "style": "3d",
    "type": "animal",
    "personality": "friendly",
    "color": "purple",
    "numVariations": 1
  }'
```

### Option 2 : Via le plugin Figma

1. Ouvrez Figma
2. Chargez le plugin Mascot
3. Remplissez le formulaire :
   - **Name:** Test Mascot
   - **Prompt/Mascot Details:** Bird with a bag
   - **Style:** 3D
   - **Type:** Animal
   - **Personality:** Friendly
   - **Color:** purple
4. Cliquez sur **"Generate"**

### Option 3 : Vérifier les logs en temps réel

1. Railway → Projet "Mascot" → Onglet **"Logs"**
2. Filtrez par : `GeminiFlash` ou `mascot-generation`
3. Générez un mascot
4. Regardez les logs pour voir :
   - Le prompt construit
   - L'appel à Gemini
   - Le résultat (succès ou erreur)

## 📊 Ce qui devrait se passer

1. **Requête reçue** → Backend crée le mascot en base
2. **Job enqueue** → Mise en queue pour génération
3. **Processor démarre** → `Processing mascot generation: [id]`
4. **Gemini appelé** → `Gemini 2.5 Flash Image service initialized`
5. **Image générée** → Upload vers S3/CDN
6. **Mascot mis à jour** → `status: completed`, URLs ajoutées

## 🐛 Dépannage

### Erreur : "Billing not enabled"

**Solution :** Activez la facturation dans Google Cloud (même avec crédits gratuits)

### Erreur : "Permission denied"

**Solution :** Vérifiez que le Service Account a bien le rôle "Utilisateur Vertex AI"

### Erreur : "Project not found"

**Solution :** Vérifiez que `GOOGLE_CLOUD_PROJECT_ID` = `mascot-485416` (exactement)

### Erreur : "Invalid credentials"

**Solution :** Vérifiez que `GOOGLE_CLOUD_CREDENTIALS` est la valeur Base64 complète (sans espaces)

### Pas d'erreur mais pas d'image générée

**Vérifiez :**
- Les logs du processor (Railway → Logs)
- Le statut du mascot dans la base de données
- Les crédits disponibles

## ✅ Checklist finale

- [ ] Variables ajoutées dans Railway
- [ ] Railway a redéployé
- [ ] Logs montrent "Gemini Flash service initialized"
- [ ] Facturation Google Cloud activée
- [ ] Test de génération effectué
- [ ] Image générée avec succès

---

**Une fois tout vérifié, vous générerez des mascots avec le même modèle et la même qualité que MascotAI.app ! 🎯**
