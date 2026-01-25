-- Ajouter 100 crédits à tous les utilisateurs
UPDATE users SET credit_balance = 100 WHERE credit_balance < 100;

-- Vérifier le résultat
SELECT id, email, credit_balance, plan FROM users ORDER BY created_at DESC;
