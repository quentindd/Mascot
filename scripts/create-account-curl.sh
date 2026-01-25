#!/bin/bash

# Script pour créer un compte avec curl (pas de problème CORS)
# Usage: bash scripts/create-account-curl.sh

RAILWAY_URL="https://mascot-production.up.railway.app"
API_URL="${RAILWAY_URL}/api/v1"

echo "🔐 Création d'un compte en production..."
echo ""

# Générer un email unique
TIMESTAMP=$(date +%s)
EMAIL="test-${TIMESTAMP}@mascot.app"
PASSWORD="TestMascot123!"

echo "📧 Email: $EMAIL"
echo "🔑 Password: $PASSWORD"
echo ""
echo "⏳ Envoi de la requête..."
echo ""

# Créer le compte
RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test User $TIMESTAMP\"
  }" \
  --max-time 10)

# Afficher la réponse
echo "📋 Réponse:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extraire le token
TOKEN=""

# Méthode 1: avec jq si disponible
if command -v jq &> /dev/null; then
  TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken // empty')
fi

# Méthode 2: avec grep
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

# Méthode 3: avec sed
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  TOKEN=$(echo "$RESPONSE" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
  echo "❌ Erreur: Token non trouvé dans la réponse"
  echo ""
  echo "Vérifiez:"
  echo "  1. Le backend est-il déployé sur Railway ?"
  echo "  2. L'URL est-elle correcte ?"
  echo "  3. Y a-t-il des erreurs dans les logs Railway ?"
  echo ""
  echo "Réponse complète:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Compte créé avec succès !"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔑 TOKEN API (copiez-le dans le plugin Figma)"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "$TOKEN"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Informations du compte:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo "   Crédits: 1 (gratuit)"
echo ""
echo "💡 Collez ce token dans le plugin Figma !"
echo ""

# Sauvegarder dans un fichier
echo "$TOKEN" > TOKEN_PRODUCTION_ACTUEL.txt
echo "📄 Token sauvegardé dans: TOKEN_PRODUCTION_ACTUEL.txt"
echo ""
