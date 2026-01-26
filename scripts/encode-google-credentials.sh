#!/bin/bash

# Script pour encoder les credentials Google Cloud en base64
# Usage: ./scripts/encode-google-credentials.sh [chemin-vers-fichier.json]

if [ -z "$1" ]; then
  echo "🔍 Recherche de fichiers de credentials Google Cloud..."
  
  # Chercher dans les emplacements courants
  POSSIBLE_PATHS=(
    "$HOME/Downloads/*-*.json"
    "$HOME/Downloads/*key*.json"
    "$HOME/Desktop/*-*.json"
    "$HOME/Desktop/*key*.json"
    "./*.json"
    "./backend/*.json"
  )
  
  FOUND_FILES=()
  for pattern in "${POSSIBLE_PATHS[@]}"; do
    for file in $pattern; do
      if [ -f "$file" ] && [ -r "$file" ]; then
        # Vérifier si c'est un fichier de credentials Google Cloud
        if grep -q '"type": "service_account"' "$file" 2>/dev/null; then
          FOUND_FILES+=("$file")
        fi
      fi
    done
  done
  
  if [ ${#FOUND_FILES[@]} -eq 0 ]; then
    echo "❌ Aucun fichier de credentials trouvé."
    echo ""
    echo "📋 Instructions:"
    echo "   1. Téléchargez votre fichier JSON depuis Google Cloud Console"
    echo "   2. Exécutez: ./scripts/encode-google-credentials.sh /chemin/vers/votre-fichier.json"
    exit 1
  elif [ ${#FOUND_FILES[@]} -eq 1 ]; then
    CREDENTIALS_FILE="${FOUND_FILES[0]}"
    echo "✅ Fichier trouvé: $CREDENTIALS_FILE"
  else
    echo "📁 Plusieurs fichiers de credentials trouvés:"
    for i in "${!FOUND_FILES[@]}"; do
      echo "   $((i+1)). ${FOUND_FILES[$i]}"
    done
    echo ""
    read -p "Choisissez un numéro (1-${#FOUND_FILES[@]}): " choice
    CREDENTIALS_FILE="${FOUND_FILES[$((choice-1))]}"
  fi
else
  CREDENTIALS_FILE="$1"
fi

if [ ! -f "$CREDENTIALS_FILE" ]; then
  echo "❌ Fichier non trouvé: $CREDENTIALS_FILE"
  exit 1
fi

echo ""
echo "📄 Fichier sélectionné: $CREDENTIALS_FILE"
echo ""

# Vérifier que c'est un fichier de credentials valide
if ! grep -q '"type": "service_account"' "$CREDENTIALS_FILE" 2>/dev/null; then
  echo "⚠️  Attention: Ce fichier ne semble pas être un fichier de credentials Google Cloud valide."
  read -p "Continuer quand même? (y/n): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    exit 1
  fi
fi

# Extraire le project_id du fichier JSON
PROJECT_ID=$(grep -o '"project_id": "[^"]*"' "$CREDENTIALS_FILE" | cut -d'"' -f4)
CLIENT_EMAIL=$(grep -o '"client_email": "[^"]*"' "$CREDENTIALS_FILE" | cut -d'"' -f4)

echo "📋 Informations du fichier:"
echo "   Project ID: ${PROJECT_ID:-N/A}"
echo "   Client Email: ${CLIENT_EMAIL:-N/A}"
echo ""

# Encoder en base64
echo "🔐 Encodage en base64..."
BASE64_ENCODED=$(cat "$CREDENTIALS_FILE" | base64 | tr -d '\n')

if [ -z "$BASE64_ENCODED" ]; then
  echo "❌ Erreur lors de l'encodage"
  exit 1
fi

echo "✅ Encodage réussi!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Variables à ajouter dans Railway:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID:-your-project-id}"
echo ""
echo "GOOGLE_CLOUD_CREDENTIALS=${BASE64_ENCODED}"
echo ""
echo "GOOGLE_CLOUD_LOCATION=us-central1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Copiez ces valeurs et ajoutez-les dans Railway → Variables"
echo ""

# Optionnel: sauvegarder dans un fichier
read -p "💾 Sauvegarder dans un fichier .env.local? (y/n): " save
if [ "$save" = "y" ] || [ "$save" = "Y" ]; then
  ENV_FILE="backend/.env.local"
  {
    echo "# Google Cloud Configuration"
    echo "GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID:-your-project-id}"
    echo "GOOGLE_CLOUD_CREDENTIALS=${BASE64_ENCODED}"
    echo "GOOGLE_CLOUD_LOCATION=us-central1"
  } >> "$ENV_FILE"
  echo "✅ Variables sauvegardées dans $ENV_FILE"
fi
