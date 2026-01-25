-- Script pour mettre tous les utilisateurs à 100 crédits
-- À exécuter dans Railway PostgreSQL

-- Essayer avec les deux noms de colonnes possibles (camelCase et snake_case)
UPDATE users SET "creditBalance" = 100 WHERE email = 'test@mascot.app';
UPDATE users SET credit_balance = 100 WHERE email = 'test@mascot.app';

-- Mettre tous les utilisateurs à 100 crédits
UPDATE users SET "creditBalance" = 100 WHERE "creditBalance" < 100;
UPDATE users SET credit_balance = 100 WHERE credit_balance < 100;

-- Vérifier les résultats
SELECT id, email, "creditBalance", credit_balance, plan 
FROM users 
WHERE email = 'test@mascot.app';

-- Voir tous les utilisateurs
SELECT id, email, "creditBalance", credit_balance, plan 
FROM users 
ORDER BY created_at DESC;
