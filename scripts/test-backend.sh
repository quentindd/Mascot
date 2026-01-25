#!/bin/bash

# Script pour tester différentes URLs Railway possibles
# Usage: bash scripts/test-backend.sh

echo "🔍 Test des URLs possibles du backend..."
echo ""

# Liste des URLs possibles
URLS=(
  "https://mascot-production.up.railway.app"
  "https://mascot-production.up.railway.app/api/v1"
  "https://mascot-production.up.railway.app/api/v1/health"
)

for URL in "${URLS[@]}"; do
  echo "Testing: $URL"
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>&1)
  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "401" ]; then
    echo "✅ Répond (HTTP $RESPONSE)"
  else
    echo "❌ Ne répond pas ou erreur: $RESPONSE"
  fi
  echo ""
done

echo "─────────────────────────────────────────────────────"
echo ""
echo "💡 Si aucune URL ne répond, vérifiez dans Railway:"
echo "   1. Le service est-il déployé ?"
echo "   2. Quelle est l'URL dans Settings → Domains ?"
echo ""
