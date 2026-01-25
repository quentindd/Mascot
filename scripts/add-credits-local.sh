#!/bin/bash

# Script pour ajouter des crédits localement
# Usage: bash scripts/add-credits-local.sh

echo "💰 Ajout de crédits au compte local..."
echo ""

# Vérifier si Docker est en cours d'exécution
if ! docker ps | grep -q postgres; then
  echo "❌ PostgreSQL n'est pas en cours d'exécution"
  echo "   Lancez d'abord: docker-compose up -d"
  exit 1
fi

# Se connecter à la base de données et ajouter des crédits
docker-compose exec -T postgres psql -U postgres -d mascot <<EOF
-- Trouver l'utilisateur test@mascot.local
SELECT id, email, credit_balance FROM users WHERE email = 'test@mascot.local';

-- Ajouter 10 crédits
UPDATE users 
SET credit_balance = credit_balance + 10 
WHERE email = 'test@mascot.local';

-- Vérifier le nouveau solde
SELECT id, email, credit_balance FROM users WHERE email = 'test@mascot.local';
EOF

echo ""
echo "✅ Crédits ajoutés !"
