#!/bin/bash

# PriceMon Database Backup Script
# Creates a timestamped backup of the PostgreSQL database

set -e

# Load environment variables
source ./backend/.env.prod

# Create backups directory if it doesn't exist
mkdir -p ./backups

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="./backups/pricemon_backup_${TIMESTAMP}.sql"

echo "🗄️  Creating database backup..."

# Create backup using docker exec
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Keep only last 7 days of backups
find ./backups -name "pricemon_backup_*.sql.gz" -mtime +7 -delete

echo "🧹 Old backups cleaned up (kept last 7 days)"
