#!/bin/bash

# Script pour encoder le fichier JSON Google Cloud en Base64
# Usage: ./encode-google-credentials.sh /chemin/vers/fichier.json

if [ -z "$1" ]; then
    echo "Usage: $0 /chemin/vers/fichier.json"
    echo ""
    echo "Exemple:"
    echo "  $0 ~/Downloads/mascot-ai-*.json"
    exit 1
fi

JSON_FILE="$1"

if [ ! -f "$JSON_FILE" ]; then
    echo "❌ Erreur: Le fichier '$JSON_FILE' n'existe pas"
    exit 1
fi

echo "📄 Fichier: $JSON_FILE"
echo ""
echo "🔐 Encodage en Base64..."
echo ""

# Encoder en Base64
BASE64_ENCODED=$(base64 -i "$JSON_FILE")

echo "✅ Encodage terminé !"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 VALEUR BASE64 (copiez tout ce qui suit):"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "$BASE64_ENCODED"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "💡 Instructions:"
echo "   1. Sélectionnez TOUT le texte ci-dessus (la longue chaîne)"
echo "   2. Copiez-le (Cmd+C)"
echo "   3. Collez-le dans Railway comme valeur de GOOGLE_CLOUD_CREDENTIALS"
echo ""

# Extraire aussi le Project ID du JSON
PROJECT_ID=$(grep -o '"project_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$JSON_FILE" | cut -d'"' -f4)
if [ ! -z "$PROJECT_ID" ]; then
    echo "📌 Project ID trouvé dans le JSON: $PROJECT_ID"
    echo ""
    echo "💾 Variables à ajouter dans Railway:"
    echo "   GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID"
    echo "   GOOGLE_CLOUD_CREDENTIALS=<la valeur Base64 ci-dessus>"
    echo "   GOOGLE_CLOUD_LOCATION=us-central1"
fi
