-- ============================================
-- SCRIPT À EXÉCUTER DANS RAILWAY POSTGRES
-- ============================================
-- Copiez-collez ce script dans Railway → Postgres → Database → Query/SQL Editor

-- 1. Mettre test@mascot.app à 100 crédits (essayer les deux formats)
UPDATE users SET "creditBalance" = 100 WHERE email = 'test@mascot.app';
UPDATE users SET credit_balance = 100 WHERE email = 'test@mascot.app';

-- 2. Mettre TOUS les utilisateurs à 100 crédits
UPDATE users SET "creditBalance" = 100 WHERE "creditBalance" < 100 OR "creditBalance" IS NULL;
UPDATE users SET credit_balance = 100 WHERE credit_balance < 100 OR credit_balance IS NULL;

-- 3. Vérifier le résultat pour test@mascot.app
SELECT 
  id, 
  email, 
  COALESCE("creditBalance", credit_balance) as credits,
  plan 
FROM users 
WHERE email = 'test@mascot.app';

-- 4. Voir tous les utilisateurs avec leurs crédits
SELECT 
  id, 
  email, 
  COALESCE("creditBalance", credit_balance) as credits,
  plan 
FROM users 
ORDER BY created_at DESC;
