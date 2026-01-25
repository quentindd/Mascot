#!/bin/bash

# Script pour créer un compte localement
# Usage: bash scripts/create-account-local.sh

echo "🔐 Création d'un nouveau compte local..."
echo ""

TIMESTAMP=$(date +%s)
EMAIL="test-${TIMESTAMP}@mascot.local"
PASSWORD="TestMascot123!"

echo "📧 Email: $EMAIL"
echo "🔑 Password: $PASSWORD"
echo ""

# Créer le compte via l'API locale
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test User $TIMESTAMP\"
  }")

# Afficher la réponse
echo "📋 Réponse:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extraire le token
TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] && command -v jq &> /dev/null; then
  TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken // empty')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Token non trouvé"
  echo ""
  echo "Vérifiez que le backend local est démarré:"
  echo "  cd backend && npm run start:dev"
  exit 1
fi

echo "✅ Compte créé !"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔑 TOKEN API"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "$TOKEN"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "💡 Collez ce token dans le plugin Figma !"
echo ""
