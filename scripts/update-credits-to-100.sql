-- Script SQL pour mettre à jour tous les comptes existants à 100 crédits
-- À exécuter dans Railway PostgreSQL

-- Mettre à jour tous les utilisateurs à 100 crédits
UPDATE users 
SET credit_balance = 100 
WHERE credit_balance < 100;

-- Vérifier les résultats
SELECT id, email, credit_balance, plan 
FROM users 
ORDER BY created_at DESC;
