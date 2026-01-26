#!/bin/bash

# Script pour modifier batchId via Railway CLI
# Usage: ./scripts/fix-batchid-column-railway.sh

echo "🔧 Modification de la colonne batchId via Railway..."

# Utiliser Railway CLI pour exécuter la commande SQL
railway run --service postgres psql -c "ALTER TABLE mascots ALTER COLUMN \"batchId\" TYPE text USING \"batchId\"::text;"

if [ $? -eq 0 ]; then
  echo "✅ Colonne batchId modifiée avec succès !"
  echo ""
  echo "🎉 Vous pouvez maintenant tester la génération dans Figma !"
else
  echo "❌ Erreur lors de la modification"
  exit 1
fi
