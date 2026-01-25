#!/bin/bash

# Script pour créer un nouveau compte avec crédits
# Usage: bash create-new-account.sh

echo "🔐 Création d'un nouveau compte..."
echo ""

# Générer un email unique
TIMESTAMP=$(date +%s)
EMAIL="test-${TIMESTAMP}@mascot.app"
PASSWORD="TestMascot123!"

echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo ""

# Créer le compte
RESPONSE=$(curl -s -X POST https://mascot-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test User $TIMESTAMP\"
  }")

# Extraire le token
TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur lors de la création du compte"
  echo "Réponse: $RESPONSE"
  exit 1
fi

echo "✅ Compte créé avec succès !"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔑 NOUVEAU TOKEN API"
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
echo "💡 Utilisez ce token dans le plugin Figma !"
echo ""
