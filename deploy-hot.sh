#!/bin/bash

# PriceMon Hot Deployment Script (Zero Database Downtime)
# Use this for regular deployments when you're updating code/frontend
# Database stays running - only application containers are restarted

set -e  # Exit on any error

echo "🚀 Starting PriceMon hot deployment (database stays running)..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.prod exists
if [ ! -f "./backend/.env.prod" ]; then
    echo -e "${RED}❌ Error: backend/.env.prod not found!${NC}"
    echo "Please create .env.prod from .env.sample and configure it."
    exit 1
fi

# Check if frontend .env.production exists
if [ ! -f "./frontend/.env.production" ]; then
    echo -e "${RED}❌ Error: frontend/.env.production not found!${NC}"
    echo "Please create .env.production with VITE_API_URL configuration."
    echo "Example: VITE_API_URL=https://your-domain.com/api"
    exit 1
fi

# Pull latest code (if using git)
echo -e "${BLUE}📥 Pulling latest code...${NC}"
git pull origin main  # Comment out if not using git

# Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# Rebuild and restart ONLY application containers (not postgres)
echo -e "${BLUE}🔄 Rebuilding application containers (database stays running)...${NC}"
echo -e "${YELLOW}Note: PostgreSQL will NOT be restarted${NC}"

# Rebuild the django and nginx containers
docker-compose -f docker-compose.prod.yml up -d --build --no-deps django nginx

# Wait a moment for containers to start
echo -e "${BLUE}⏳ Waiting for containers to be ready...${NC}"
sleep 5

# Run migrations on the running database
echo -e "${BLUE}📊 Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T django python manage.py migrate

# Collect static files
echo -e "${BLUE}📦 Collecting static files...${NC}"
docker-compose -f docker-compose.prod.yml exec -T django python manage.py collectstatic --noinput

# Show container status
echo -e "${BLUE}📋 Container status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}✅ Hot deployment complete!${NC}"
echo ""
echo "Application updated successfully:"
echo "  - Frontend: Rebuilt and deployed"
echo "  - Backend: Django container restarted"
echo "  - Database: ${GREEN}Stayed running (zero downtime)${NC}"
echo ""
echo "View logs with: docker-compose -f docker-compose.prod.yml logs -f django"
