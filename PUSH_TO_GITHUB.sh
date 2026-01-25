#!/bin/bash

# Script pour push sur GitHub
cd /Users/quentin/Documents/Mascot

echo "📤 Push des changements sur GitHub..."
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Changements poussés avec succès sur GitHub !"
    echo ""
    echo "🔄 Railway va automatiquement détecter le nouveau commit et redéployer."
    echo ""
    echo "👉 Allez sur Railway pour voir le déploiement en cours :"
    echo "   https://railway.app/dashboard"
else
    echo ""
    echo "❌ Erreur lors du push"
    echo ""
    echo "Si vous utilisez HTTPS, vous devez vous authentifier."
    echo "Si vous utilisez SSH, vérifiez que votre clé est configurée."
fi
