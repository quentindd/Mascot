#!/bin/bash

# Script pour créer un nouveau compte et extraire le token
# Usage: bash scripts/create-account.sh

echo "🔐 Création d'un nouveau compte..."
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

# Créer le compte et capturer la réponse complète
RESPONSE=$(curl -s -X POST https://mascot-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test User $TIMESTAMP\"
  }")

# Afficher la réponse complète pour debug
echo "📋 Réponse complète:"
echo "$RESPONSE"
echo ""
echo "─────────────────────────────────────────────────────"
echo ""

# Extraire le token avec plusieurs méthodes
TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Si pas trouvé, essayer avec jq si disponible
if [ -z "$TOKEN" ]; then
  if command -v jq &> /dev/null; then
    TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken // empty')
  fi
fi

# Si toujours pas trouvé, essayer autre format
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Token non trouvé dans la réponse"
  echo ""
  echo "Vérifiez si le compte existe déjà ou s'il y a une erreur."
  echo ""
  echo "Réponse reçue:"
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
