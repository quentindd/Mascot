# 🔗 Liens directs Google Cloud Console

## 📍 Vérifier l'API Vertex AI

### Lien direct vers l'API Vertex AI :
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=mascot-485416

**Ou** pour voir toutes les APIs :
https://console.cloud.google.com/apis/library?project=mascot-485416

### Si l'API n'est pas activée :
1. Cliquez sur le bouton **"Enable"** (Activer)
2. Attendez quelques secondes
3. Vous verrez "API enabled" (API activée)

---

## 👤 Vérifier les permissions du service account

### Lien direct vers IAM :
https://console.cloud.google.com/iam-admin/iam?project=mascot-485416

### Lien direct vers les Service Accounts :
https://console.cloud.google.com/iam-admin/serviceaccounts?project=mascot-485416

### Pour modifier les permissions :
1. Cliquez sur `mascot-ai-generator@mascot-485416.iam.gserviceaccount.com`
2. Allez dans l'onglet **"Permissions"** (ou **"Autorisations"**)
3. Cliquez sur **"Grant Access"** (Accorder l'accès)
4. Ajoutez le rôle **"Vertex AI User"** (`roles/aiplatform.user`)

---

## 🎯 Vérification rapide

### 1. API Vertex AI activée ?
👉 https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=mascot-485416

### 2. Service account a les permissions ?
👉 https://console.cloud.google.com/iam-admin/serviceaccounts?project=mascot-485416

---

## 📝 Checklist

- [ ] API Vertex AI activée (bouton "Manage" visible)
- [ ] Service account a le rôle "Vertex AI User"
- [ ] Credentials sont correctement configurés dans Railway (3100 caractères)
