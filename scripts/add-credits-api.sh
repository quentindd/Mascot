#!/bin/bash

# Script pour ajouter des crédits via l'API
# Usage: ./scripts/add-credits-api.sh <token> <amount>

TOKEN="${1}"
AMOUNT="${2:-10}"
API_URL="https://mascot-production.up.railway.app"

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Token manquant"
  echo ""
  echo "Usage: ./scripts/add-credits-api.sh <token> [amount]"
  echo ""
  echo "Exemple:"
  echo "  ./scripts/add-credits-api.sh eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... 10"
  echo ""
  exit 1
fi

echo "💰 Ajout de $AMOUNT crédits via l'API..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/v1/credits/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"amount\": $AMOUNT, \"description\": \"Added via script\"}")

echo "Réponse:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Vérifier le nouveau solde
echo "📊 Vérification du solde..."
BALANCE=$(curl -s -X GET "$API_URL/api/v1/credits/balance" \
  -H "Authorization: Bearer $TOKEN")

echo "Solde actuel:"
echo "$BALANCE" | jq '.' 2>/dev/null || echo "$BALANCE"
