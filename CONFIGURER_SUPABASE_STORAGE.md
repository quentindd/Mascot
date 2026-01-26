# 🚀 Configurer Supabase Storage pour Mascot

## ✅ Pourquoi Supabase Storage ?

- **Gratuit** jusqu'à 1 GB de stockage
- **Simple** à configurer (2 variables d'environnement)
- **CDN intégré** (images servies rapidement)
- **Pas besoin d'AWS** (plus simple pour commencer)

## 📋 Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur https://supabase.com
2. Créez un compte (gratuit)
3. Créez un nouveau projet
4. Notez votre **Project URL** et **API Key**

### 2. Créer un bucket de stockage

1. Dans votre projet Supabase, allez dans **Storage**
2. Cliquez sur **New bucket**
3. Nommez-le `mascots` (ou le nom que vous voulez)
4. Cochez **Public bucket** (pour que les images soient accessibles publiquement)
5. Cliquez sur **Create bucket**

### 3. Configurer les permissions

1. Allez dans **Storage** → **Policies**
2. Pour le bucket `mascots`, créez une politique :
   - **Policy name**: `Allow public read access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'mascots')
     ```
   - **Policy command**: `SELECT`
   - Cliquez sur **Save**

### 4. Récupérer les credentials

1. Allez dans **Settings** → **API**
2. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **service_role key** (⚠️ **IMPORTANT** : utilisez la `service_role` key, pas la `anon` key)

### 5. Configurer dans Railway

Ajoutez ces variables d'environnement dans Railway :

1. `SUPABASE_URL` = votre Project URL (ex: `https://xxxxx.supabase.co`)
2. `SUPABASE_SERVICE_ROLE_KEY` = votre service_role key
3. `SUPABASE_BUCKET` = `mascots` (ou le nom de votre bucket)

## 🎯 Variables à ajouter dans Railway

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=mascots
```

## ✅ Vérification

Une fois configuré, les logs devraient montrer :
```
[StorageService] StorageService initialized with Supabase Storage
```

Et lors de l'upload :
```
[StorageService] Successfully uploaded mascots/xxx/full-body-xxx.png to Supabase Storage
```

## 🔒 Sécurité

⚠️ **Important** : La `service_role` key a tous les droits. Ne la partagez jamais publiquement et ne la commitez pas dans Git.

## 📝 Notes

- Les images seront accessibles via des URLs publiques comme : `https://xxxxx.supabase.co/storage/v1/object/public/mascots/xxx.png`
- Le CDN de Supabase est automatiquement utilisé
- Gratuit jusqu'à 1 GB, puis payant selon l'usage

## 🆘 Dépannage

### Erreur : "Storage not configured"
→ Vérifiez que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont bien configurés dans Railway

### Erreur : "Bucket not found"
→ Vérifiez que le bucket `mascots` existe dans Supabase et que `SUPABASE_BUCKET` correspond

### Erreur : "Permission denied"
→ Vérifiez que vous utilisez la `service_role` key (pas la `anon` key) et que les politiques de bucket sont correctes
