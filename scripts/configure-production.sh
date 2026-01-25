#!/bin/bash

# Script pour configurer la production Railway
# Usage: bash scripts/configure-production.sh https://votre-url.up.railway.app

if [ -z "$1" ]; then
  echo "❌ Erreur: URL Railway requise"
  echo ""
  echo "Usage: bash scripts/configure-production.sh https://votre-url.up.railway.app"
  echo ""
  echo "Pour trouver votre URL Railway:"
  echo "  1. Allez sur https://railway.app"
  echo "  2. Cliquez sur votre projet"
  echo "  3. Cliquez sur le service 'Mascot'"
  echo "  4. Onglet 'Settings' → 'Domains'"
  echo "  5. Copiez l'URL publique"
  exit 1
fi

RAILWAY_URL="$1"
# Enlever le trailing slash si présent
RAILWAY_URL="${RAILWAY_URL%/}"
API_URL="${RAILWAY_URL}/api/v1"

echo "🔧 Configuration de la production Railway..."
echo ""
echo "URL Railway: $RAILWAY_URL"
echo "URL API: $API_URL"
echo ""

# 1. Mettre à jour figma-plugin/src/api/client.ts
echo "📝 Mise à jour de figma-plugin/src/api/client.ts..."
sed -i '' "s|const API_BASE_URL = '.*';|const API_BASE_URL = '${API_URL}';|g" figma-plugin/src/api/client.ts
echo "✅ client.ts mis à jour"

# 2. Mettre à jour figma-plugin/manifest.json
echo "📝 Mise à jour de figma-plugin/manifest.json..."
# Extraire le domaine (sans https://)
DOMAIN=$(echo "$RAILWAY_URL" | sed 's|https://||')
# Mettre à jour le manifest.json
python3 <<EOF
import json
import re

with open('figma-plugin/manifest.json', 'r') as f:
    manifest = json.load(f)

# Mettre à jour allowedDomains
if 'networkAccess' in manifest and 'allowedDomains' in manifest['networkAccess']:
    domains = manifest['networkAccess']['allowedDomains']
    # Remplacer ou ajouter le domaine Railway
    if any('railway' in d for d in domains):
        manifest['networkAccess']['allowedDomains'] = [d for d in domains if 'railway' not in d]
    manifest['networkAccess']['allowedDomains'].append("$RAILWAY_URL")
else:
    manifest['networkAccess'] = {
        "allowedDomains": ["$RAILWAY_URL"]
    }

with open('figma-plugin/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
EOF
echo "✅ manifest.json mis à jour"

# 3. Tester la connexion
echo ""
echo "🔍 Test de connexion au backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${RAILWAY_URL}/api/v1/health" 2>&1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
  echo "✅ Backend accessible (HTTP $HTTP_CODE)"
else
  echo "⚠️  Backend ne répond pas (HTTP $HTTP_CODE)"
  echo "   Vérifiez que le service est déployé sur Railway"
fi

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Rebuilder le plugin: cd figma-plugin && npm run build"
echo "  2. Créer un compte: bash scripts/create-account-production.sh"
echo ""
