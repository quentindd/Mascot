#!/bin/bash

set -e

echo "🚀 Configuration et démarrage du backend Mascot"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Vérifier Docker
echo -e "${YELLOW}1. Vérification de Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker n'est pas démarré.${NC}"
    echo ""
    echo "Veuillez :"
    echo "  1. Ouvrir Docker Desktop depuis Applications"
    echo "  2. Attendre que Docker soit complètement démarré"
    echo "  3. Relancer ce script"
    exit 1
fi
echo -e "${GREEN}✓ Docker est démarré${NC}"
echo ""

# 2. Installer les dépendances
echo -e "${YELLOW}2. Installation des dépendances npm...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dépendances installées${NC}"
else
    echo -e "${GREEN}✓ Dépendances déjà installées${NC}"
fi
echo ""

# 3. Démarrer PostgreSQL et Redis
echo -e "${YELLOW}3. Démarrage de PostgreSQL et Redis...${NC}"
docker-compose up -d
sleep 3

# Vérifier que les services sont démarrés
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ PostgreSQL et Redis sont démarrés${NC}"
else
    echo -e "${RED}❌ Erreur lors du démarrage des services${NC}"
    docker-compose logs
    exit 1
fi
echo ""

# 4. Attendre que PostgreSQL soit prêt
echo -e "${YELLOW}4. Attente que PostgreSQL soit prêt...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U user > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL est prêt${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL n'est pas prêt après 30 secondes${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# 5. Démarrer le backend
echo -e "${YELLOW}5. Démarrage du backend NestJS...${NC}"
echo -e "${GREEN}Le backend va démarrer sur http://localhost:3000${NC}"
echo ""
echo "Pour arrêter : Ctrl+C"
echo ""

npm run start:dev
