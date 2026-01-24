#!/bin/bash

echo "🚀 Démarrage du backend Mascot"
echo ""

# Vérifier que Docker est démarré
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré. Veuillez démarrer Docker Desktop."
    exit 1
fi

echo "✓ Docker est démarré"
echo ""

# Démarrer PostgreSQL et Redis
echo "📦 Démarrage de PostgreSQL et Redis..."
docker-compose up -d

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
sleep 3

# Vérifier que les services sont démarrés
if docker-compose ps | grep -q "Up"; then
    echo "✓ PostgreSQL et Redis sont démarrés"
else
    echo "❌ Erreur lors du démarrage des services"
    exit 1
fi

echo ""
echo "🎯 Démarrage du backend NestJS..."
echo ""

# Démarrer le backend
npm run start:dev
