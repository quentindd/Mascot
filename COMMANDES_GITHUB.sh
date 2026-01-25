#!/bin/bash

echo "🚀 Script de déploiement GitHub"
echo ""
echo "⚠️  AVANT D'EXÉCUTER CE SCRIPT :"
echo "1. Créez un repo sur GitHub : https://github.com/new"
echo "2. Nom du repo : mascot"
echo "3. Ne cochez RIEN (pas de README, .gitignore, etc.)"
echo "4. Cliquez sur 'Create repository'"
echo ""
read -p "Appuyez sur Entrée une fois le repo créé sur GitHub..."
echo ""
read -p "Entrez votre username GitHub : " GITHUB_USERNAME
echo ""

cd /Users/quentin/Documents/Mascot

echo "📦 Ajout du remote GitHub..."
git remote add origin https://github.com/$GITHUB_USERNAME/mascot.git

echo "🌿 Renommage de la branche en main..."
git branch -M main

echo "⬆️  Push vers GitHub..."
git push -u origin main

echo ""
echo "✅ Code poussé sur GitHub !"
echo ""
echo "📋 PROCHAINE ÉTAPE :"
echo "1. Allez sur https://railway.app"
echo "2. New Project → Deploy from GitHub repo"
echo "3. Choisissez 'mascot'"
echo ""
