# 🔷 Supabase pour Mascot

## Ce qu'est Supabase

Supabase est un **Backend-as-a-Service** (comme Firebase), pas une plateforme de déploiement.

---

## Comment utiliser Supabase dans ce projet

### Option A : Supabase pour la base de données SEULEMENT

**Votre backend NestJS reste** (déployé sur Railway/Render/etc.)
**Mais utilise Supabase PostgreSQL** au lieu de la base locale

**Avantages** :
- ✅ PostgreSQL gratuit et illimité (jusqu'à 500 MB)
- ✅ Interface d'admin visuelle
- ✅ Backups automatiques
- ✅ Pas besoin de gérer PostgreSQL

**Étapes** :
1. Créer un projet Supabase : https://supabase.com
2. Récupérer la `DATABASE_URL`
3. La mettre dans les variables d'environnement de Railway/Render
4. Le reste du backend reste identique

---

### Option B : Supabase pour base de données + stockage

**Utiliser Supabase Storage** pour héberger les images générées (au lieu de S3)

**Avantages** :
- ✅ Stockage gratuit (1 GB)
- ✅ CDN intégré
- ✅ API simple
- ✅ Moins cher que S3 pour commencer

**Modifications nécessaires** :
- Remplacer le service `storage.service.ts`
- Utiliser `@supabase/supabase-js`
- Uploader les images sur Supabase Storage

---

### Option C : Remplacer tout le backend par Supabase

**Architecture alternative** : Plugin Figma → Supabase directement

**Ce que Supabase fournirait** :
- ✅ Base de données PostgreSQL
- ✅ Authentification (Supabase Auth au lieu de JWT)
- ✅ Stockage (Supabase Storage)
- ✅ API REST auto-générée
- ✅ Functions (Edge Functions) pour la logique métier

**Ce qu'il faudrait quand même** :
- ❌ Un service pour appeler les API IA (Replicate/Together AI)
- ❌ Gestion des jobs (génération asynchrone)
- ❌ Logique métier complexe

**Inconvénients** :
- ⚠️ Nécessite de réécrire une grosse partie du code
- ⚠️ Moins de contrôle sur la logique métier
- ⚠️ Edge Functions ont des limitations

---

## 📊 Comparaison des architectures

### Architecture actuelle (NestJS)

```
Plugin Figma → NestJS (Railway) → PostgreSQL (Railway)
                ↓                  ↓ Redis (Railway)
                ↓
            AI APIs (Replicate)
                ↓
            S3 (images)
```

**Avantages** :
- ✅ Contrôle total
- ✅ Logique métier complexe facile
- ✅ Jobs/queues avec BullMQ
- ✅ Code déjà écrit

---

### Architecture hybride (NestJS + Supabase)

```
Plugin Figma → NestJS (Railway) → PostgreSQL (Supabase)
                ↓                  ↓ Redis (Railway/Upstash)
                ↓
            AI APIs (Replicate)
                ↓
            Supabase Storage (images)
```

**Avantages** :
- ✅ PostgreSQL gratuit
- ✅ Stockage gratuit
- ✅ Interface admin visuelle
- ✅ Garde toute la logique NestJS

**Inconvénients** :
- ⚠️ Dépendance à plusieurs services

---

### Architecture full Supabase (Alternative)

```
Plugin Figma → Supabase Edge Functions → PostgreSQL (Supabase)
                                       ↓ Supabase Storage
                                       ↓ Supabase Auth
```

**Avantages** :
- ✅ Tout-en-un
- ✅ Gratuit jusqu'à un bon niveau
- ✅ Simple pour des cas simples

**Inconvénients** :
- ❌ Nécessite de réécrire le code
- ❌ Edge Functions limitées (max 10s d'exécution)
- ❌ Jobs asynchrones complexes difficiles
- ❌ Moins adapté pour l'IA (qui prend du temps)

---

## 🎯 Ma recommandation

### Pour ce projet (Mascot avec IA)

**Architecture hybride** : NestJS + Supabase

```
Backend NestJS (Railway)
├─ PostgreSQL (Supabase) ← Gratuit
├─ Redis (Upstash) ← Gratuit
├─ Storage (Supabase) ← Gratuit
└─ AI (Replicate) ← Payant selon usage
```

**Pourquoi ?**
- ✅ Garde toute votre logique NestJS (jobs, queues)
- ✅ PostgreSQL + Storage gratuits
- ✅ Facile à migrer (changer juste DATABASE_URL)
- ✅ Interface admin pour voir les données

**Coût total** :
- Supabase : **Gratuit** (jusqu'à 500 MB DB + 1 GB storage)
- Railway : **$5/mois** (ou 500h gratuit)
- Upstash Redis : **Gratuit** (10k commandes/jour)
- **Total : $0-5/mois**

---

## 🚀 Guide : Migrer vers Supabase PostgreSQL

### Étape 1 : Créer un projet Supabase

1. Allez sur : https://supabase.com
2. Créez un compte (gratuit)
3. **New Project**
4. Choisissez un nom : `mascot`
5. Choisissez un mot de passe fort pour la DB
6. Choisissez une région proche (Europe West, etc.)

### Étape 2 : Obtenir la DATABASE_URL

1. Dans Supabase, allez dans **Settings** → **Database**
2. Scrollez jusqu'à **Connection string** → **URI**
3. Copiez la string (ressemble à) :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

### Étape 3 : Mettre à jour Railway

1. Dans Railway, allez dans votre service backend
2. **Variables** → Modifier `DATABASE_URL`
3. Collez la DATABASE_URL de Supabase
4. Railway redéploie automatiquement

### Étape 4 : Vérifier les migrations

Les tables seront créées automatiquement au démarrage (TypeORM `synchronize: true`)

**Dans Supabase** :
1. Allez dans **Table Editor**
2. Vous verrez toutes vos tables : `users`, `mascots`, `animations`, etc.

✅ **Terminé !** Votre backend utilise maintenant Supabase PostgreSQL

---

## 💾 Guide : Utiliser Supabase Storage

### Étape 1 : Créer un bucket

1. Dans Supabase, **Storage**
2. **New bucket** : `mascot-images`
3. **Public** : ✅ (pour que les images soient accessibles)

### Étape 2 : Installer le client Supabase

```bash
cd backend
npm install @supabase/supabase-js
```

### Étape 3 : Modifier storage.service.ts

```typescript
import { createClient } from '@supabase/supabase-js';

export class StorageService {
  private supabase;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY')
    );
  }

  async uploadImage(buffer: Buffer, filename: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('mascot-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) throw error;

    // URL publique
    const { data: { publicUrl } } = this.supabase.storage
      .from('mascot-images')
      .getPublicUrl(filename);

    return publicUrl;
  }
}
```

### Étape 4 : Configurer les variables

Dans Railway :
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=votre-clé-anon
```

Trouvez ces valeurs dans Supabase → **Settings** → **API**

✅ **Les images seront stockées sur Supabase !**

---

## 📊 Coûts Supabase

### Plan gratuit
- ✅ 500 MB de base de données
- ✅ 1 GB de stockage
- ✅ 2 GB de bande passante/mois
- ✅ 50k requêtes Auth/mois
- ✅ Illimité en lecture

**Largement suffisant pour commencer !**

### Plan Pro ($25/mois)
- 8 GB de base de données
- 100 GB de stockage
- 250 GB de bande passante
- + Backups quotidiens

---

## 🤔 Alors, Supabase ou pas ?

### Utilisez Supabase SI :
- ✅ Vous voulez PostgreSQL gratuit
- ✅ Vous voulez un stockage gratuit
- ✅ Vous aimez les interfaces admin
- ✅ Vous voulez réduire les coûts

### Gardez Railway PostgreSQL SI :
- ✅ Vous voulez tout au même endroit
- ✅ Vous préférez la simplicité
- ✅ Le coût n'est pas un problème ($5-10/mois)

---

## 🎯 Ma suggestion

**Phase 1 (maintenant)** : Déployez sur Railway avec tout inclus
- Simple et rapide
- Tout fonctionne ensemble
- Testez votre plugin

**Phase 2 (plus tard)** : Migrez vers Supabase si besoin
- Quand vous avez besoin de réduire les coûts
- Quand vous voulez plus de stockage
- Quand vous avez besoin de l'interface admin

La migration est facile (juste changer DATABASE_URL) !

---

## 📚 Ressources

- **Supabase Docs** : https://supabase.com/docs
- **Supabase Storage** : https://supabase.com/docs/guides/storage
- **Supabase avec NestJS** : https://supabase.com/docs/guides/getting-started/tutorials/with-nestjs

---

Voulez-vous que je vous aide à intégrer Supabase maintenant, ou préférez-vous d'abord déployer sur Railway avec tout inclus ? 🚀
