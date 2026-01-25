#!/bin/bash

# Script pour ajouter des crédits à un utilisateur en production
# Usage: ./scripts/add-credits-production.sh <email> <amount>

EMAIL="${1:-test@mascot.app}"
AMOUNT="${2:-10}"
API_URL="https://mascot-production.up.railway.app"

echo "🔧 Ajout de $AMOUNT crédits à $EMAIL..."

# Note: Pour l'instant, il faut ajouter les crédits directement en base de données
# car il n'y a pas d'endpoint public pour cela.
# 
# Solution temporaire: Utiliser Railway CLI ou psql directement
#
# Via Railway CLI:
# railway connect postgres
# psql
# UPDATE users SET credit_balance = credit_balance + $AMOUNT WHERE email = '$EMAIL';
# SELECT id, email, credit_balance FROM users WHERE email = '$EMAIL';

echo ""
echo "⚠️  Pour ajouter des crédits, vous devez:"
echo "1. Aller sur Railway → votre projet → PostgreSQL"
echo "2. Cliquer sur 'Connect' ou utiliser Railway CLI"
echo "3. Exécuter cette commande SQL:"
echo ""
echo "   UPDATE users SET credit_balance = credit_balance + $AMOUNT WHERE email = '$EMAIL';"
echo "   SELECT id, email, credit_balance FROM users WHERE email = '$EMAIL';"
echo ""
