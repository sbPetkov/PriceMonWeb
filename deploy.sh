#!/bin/bash

# PriceMon Production Deployment Script
# Run this script on your VPS to deploy or update the application

set -e  # Exit on any error

echo "🚀 Starting PriceMon deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.prod exists
if [ ! -f "./backend/.env.prod" ]; then
    echo -e "${RED}❌ Error: backend/.env.prod not found!${NC}"
    echo "Please create .env.prod from .env.sample and configure it."
    exit 1
fi

# Pull latest code (if using git)
echo -e "${BLUE}📥 Pulling latest code...${NC}"
# git pull origin main  # Uncomment if using git

# Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Build and start containers
echo -e "${BLUE}🐳 Building and starting Docker containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for postgres to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 10

# Run migrations
echo -e "${BLUE}📊 Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T django python manage.py migrate

# Collect static files
echo -e "${BLUE}📦 Collecting static files...${NC}"
docker-compose -f docker-compose.prod.yml exec -T django python manage.py collectstatic --noinput

# Show container status
echo -e "${BLUE}📋 Container status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Application is now running at:"
echo "  - Frontend: http://your-server-ip"
echo "  - Backend API: http://your-server-ip/api"
echo "  - Admin: http://your-server-ip/admin"
echo ""
echo "View logs with: docker-compose -f docker-compose.prod.yml logs -f"
