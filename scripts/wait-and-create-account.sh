#!/bin/bash

# Script qui attend que le backend soit accessible puis crée un compte
# Usage: bash scripts/wait-and-create-account.sh

RAILWAY_URL="https://mascot-production.up.railway.app"
API_URL="${RAILWAY_URL}/api/v1"

echo "⏳ Attente que le backend Railway soit accessible..."
echo "URL: $RAILWAY_URL"
echo ""

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "Tentative $ATTEMPT/$MAX_ATTEMPTS..."
  
  # Tester la connexion
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" --max-time 5 2>&1)
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Backend accessible ! (HTTP $HTTP_CODE)"
    echo ""
    break
  fi
  
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "   Backend pas encore prêt, nouvelle tentative dans 5 secondes..."
    sleep 5
  fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Le backend n'est pas accessible après $MAX_ATTEMPTS tentatives"
  echo ""
  echo "Vérifiez dans Railway:"
  echo "  1. Le service est-il déployé ? (Onglet Deployments)"
  echo "  2. Y a-t-il des erreurs ? (Onglet Logs)"
  echo "  3. Le service est-il en cours d'exécution ? (Onglet Metrics)"
  exit 1
fi

echo "🔐 Création d'un compte..."
echo ""

# Générer un email unique
TIMESTAMP=$(date +%s)
EMAIL="test-${TIMESTAMP}@mascot.app"
PASSWORD="TestMascot123!"

echo "📧 Email: $EMAIL"
echo "🔑 Password: $PASSWORD"
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

if command -v jq &> /dev/null; then
  TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken // empty')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
  echo "❌ Erreur: Token non trouvé"
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

# Sauvegarder
echo "$TOKEN" > TOKEN_PRODUCTION_ACTUEL.txt
echo "📄 Token sauvegardé dans: TOKEN_PRODUCTION_ACTUEL.txt"
echo ""
