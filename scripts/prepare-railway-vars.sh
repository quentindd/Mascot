#!/bin/bash

# Script pour préparer les variables Railway
# Usage: ./prepare-railway-vars.sh /chemin/vers/fichier.json

if [ -z "$1" ]; then
    echo "❌ Erreur: Veuillez fournir le chemin du fichier JSON"
    echo ""
    echo "Usage:"
    echo "  bash prepare-railway-vars.sh /chemin/vers/votre-fichier.json"
    echo ""
    echo "Exemple:"
    echo "  bash prepare-railway-vars.sh ~/Downloads/mascot-ai-123456-abc.json"
    exit 1
fi

JSON_FILE="$1"

if [ ! -f "$JSON_FILE" ]; then
    echo "❌ Erreur: Le fichier '$JSON_FILE' n'existe pas"
    exit 1
fi

echo "📄 Fichier: $JSON_FILE"
echo ""

# Extraire le Project ID
PROJECT_ID=$(grep -o '"project_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$JSON_FILE" | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  Project ID non trouvé dans le JSON"
    echo "   Vérifiez manuellement dans le fichier"
else
    echo "✅ Project ID trouvé: $PROJECT_ID"
fi

echo ""
echo "🔐 Encodage en Base64..."
BASE64_ENCODED=$(base64 -i "$JSON_FILE" 2>/dev/null || base64 "$JSON_FILE")

echo "✅ Encodage terminé !"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 VARIABLES POUR RAILWAY"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. GOOGLE_CLOUD_PROJECT_ID"
echo "   Valeur: $PROJECT_ID"
echo ""
echo "2. GOOGLE_CLOUD_CREDENTIALS"
echo "   Valeur (Base64 - copiez TOUT):"
echo "   ───────────────────────────────────────────────────"
echo "$BASE64_ENCODED"
echo "   ───────────────────────────────────────────────────"
echo ""
echo "3. GOOGLE_CLOUD_LOCATION"
echo "   Valeur: us-central1"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "💡 Instructions Railway:"
echo "   1. Allez sur Railway → Votre projet → Variables"
echo "   2. Ajoutez les 3 variables ci-dessus"
echo "   3. Pour GOOGLE_CLOUD_CREDENTIALS, copiez TOUTE la chaîne Base64"
echo ""
