#!/bin/bash

# Script pour créer un compte en production Railway
# Usage: bash scripts/create-account-production.sh [URL_RAILWAY]

# Lire l'URL depuis l'argument ou depuis client.ts
if [ -z "$1" ]; then
  # Extraire l'URL depuis client.ts
  API_URL=$(grep "const API_BASE_URL" figma-plugin/src/api/client.ts | sed "s/.*'\(.*\)'.*/\1/")
  if [ -z "$API_URL" ]; then
    echo "❌ Erreur: URL Railway non trouvée"
    echo ""
    echo "Usage: bash scripts/create-account-production.sh https://votre-url.up.railway.app"
    echo "   OU configurez d'abord avec: bash scripts/configure-production.sh https://votre-url.up.railway.app"
    exit 1
  fi
  BASE_URL=$(echo "$API_URL" | sed 's|/api/v1$||')
else
  BASE_URL="$1"
  BASE_URL="${BASE_URL%/}"
  API_URL="${BASE_URL}/api/v1"
fi

echo "🔐 Création d'un compte en production..."
echo ""
echo "URL API: $API_URL"
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
  }")

# Afficher la réponse pour debug
echo "📋 Réponse du serveur:"
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
  echo "  3. Le compte existe-t-il déjà ?"
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
echo "💡 Collez ce token dans le plugin Figma pour vous connecter !"
echo ""

# Sauvegarder dans un fichier
echo "$TOKEN" > TOKEN_PRODUCTION_ACTUEL.txt
echo "📄 Token sauvegardé dans: TOKEN_PRODUCTION_ACTUEL.txt"
echo ""
