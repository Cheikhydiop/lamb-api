#!/bin/bash

# Better API - Quick Start Script
# Ce script configure et lance le projet

set -e

echo "======================================"
echo "Better API - Quick Start"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Check Node.js
echo -e "${BLUE}1. Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# 2. Check PostgreSQL
echo ""
echo -e "${BLUE}2. Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Make sure PostgreSQL is installed and running."
else
    echo -e "${GREEN}✓ PostgreSQL found${NC}"
fi

# 3. Install dependencies
echo ""
echo -e "${BLUE}3. Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# 4. Setup .env
echo ""
echo -e "${BLUE}4. Setting up .env file...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env created from .env.example${NC}"
    echo "⚠️  Please edit .env with your configuration"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

# 5. Database setup
echo ""
echo -e "${BLUE}5. Setting up database...${NC}"
echo "Running migrations..."
npx prisma migrate dev --skip-generate
echo -e "${GREEN}✓ Migrations completed${NC}"

# 6. Seed database
echo ""
echo -e "${BLUE}6. Seeding database...${NC}"
npx prisma db seed
echo -e "${GREEN}✓ Database seeded${NC}"

# 7. Summary
echo ""
echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Test accounts created:"
echo "  Admin:"
echo "    Email: admin@better.app"
echo "    Password: admin123"
echo ""
echo "  Bettor 1:"
echo "    Email: bettor1@better.app"
echo "    Password: bettor123"
echo ""
echo "  Bettor 2:"
echo "    Email: bettor2@better.app"
echo "    Password: bettor123"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Start development: npm run dev"
echo "  3. Visit: http://localhost:3000/health"
echo ""
echo "Documentation:"
echo "  - API_DOCUMENTATION.md - All endpoints"
echo "  - ARCHITECTURE.md - Project structure"
echo "  - GETTING_STARTED.md - Setup guide"
echo "  - API_EXAMPLES.md - cURL examples"
echo ""
