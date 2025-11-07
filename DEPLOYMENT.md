# PriceMon WebVersion - Production Deployment Guide

This guide walks you through deploying PriceMon to a production VPS with Docker, Nginx, Django, and PostgreSQL.

## 📋 Prerequisites

### Server Requirements
- VPS with Ubuntu 20.04+ or similar
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ disk space
- Root or sudo access

### Tools to Install on Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### Domain Setup (Cloudflare)
1. Log in to Cloudflare
2. Add domain `price-mon.com`
3. Update nameservers at your registrar
4. Add DNS A record pointing to your VPS IP
5. Enable Cloudflare proxy (orange cloud)
6. SSL/TLS settings: Set to "Full" mode

## 🚀 Initial Deployment

### 1. Clone Repository to Server
```bash
# SSH into your VPS
ssh user@your-server-ip

# Clone the repo (or upload via FTP)
cd /var/www
sudo mkdir -p pricemon
sudo chown $USER:$USER pricemon
cd pricemon
# Upload your code here
```

### 2. Create Production Environment File
```bash
cd /var/www/pricemon/WebVersion/backend
cp .env.sample .env.prod
```

Edit `.env.prod` with your production values:
```bash
# Django Core
SECRET_KEY=<generate-long-random-string>
DEBUG=False
ALLOWED_HOSTS=price-mon.com,www.price-mon.com,your-vps-ip

# Database
DATABASE_ENGINE=django.db.backends.postgresql
POSTGRES_DB=pricemon
POSTGRES_USER=pricemon_user
POSTGRES_PASSWORD=<strong-password-here>
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# CORS Settings
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://price-mon.com,https://www.price-mon.com

# Frontend URL
FRONTEND_URL=https://price-mon.com
```

**Generate a secure SECRET_KEY:**
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 3. Build Frontend
```bash
cd /var/www/pricemon/WebVersion/frontend
npm install
npm run build
```

Verify `dist/` directory was created with built files.

### 4. Deploy with Docker
```bash
cd /var/www/pricemon/WebVersion
./deploy.sh
```

This script will:
- Build all Docker images
- Start PostgreSQL, Django, and Nginx containers
- Run database migrations
- Collect static files

### 5. Create Django Superuser
```bash
docker-compose -f docker-compose.prod.yml exec django python manage.py createsuperuser
```

### 6. Verify Deployment
- Frontend: http://your-vps-ip
- API: http://your-vps-ip/api
- Admin: http://your-vps-ip/admin

## 🔄 Updating the Application

```bash
cd /var/www/pricemon/WebVersion
./deploy.sh
```

## 💾 Database Backups

### Manual Backup
```bash
cd /var/www/pricemon/WebVersion
./backup_db.sh
```

Backups are saved to `./backups/` with automatic cleanup (keeps 7 days).

### Automated Backups (Cron)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/pricemon/WebVersion && ./backup_db.sh >> /var/log/pricemon_backup.log 2>&1
```

### Restore from Backup
```bash
# Extract backup
gunzip ./backups/pricemon_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U pricemon_user -d pricemon < ./backups/pricemon_backup_YYYYMMDD_HHMMSS.sql
```

## 🔍 Troubleshooting

### View Logs
```bash
# All containers
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f django
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart django
```

### Access Django Shell
```bash
docker-compose -f docker-compose.prod.yml exec django python manage.py shell
```

### Access PostgreSQL
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U pricemon_user -d pricemon
```

### Check Container Status
```bash
docker-compose -f docker-compose.prod.yml ps
docker stats
```

## 🔒 Security Checklist

- [ ] Change default SECRET_KEY in .env.prod
- [ ] Use strong POSTGRES_PASSWORD
- [ ] Set DEBUG=False in production
- [ ] Restrict ALLOWED_HOSTS to your domain
- [ ] Set CORS_ALLOW_ALL_ORIGINS=False
- [ ] Cloudflare SSL enabled (Full mode)
- [ ] Regular database backups automated
- [ ] Firewall configured (allow 80, 443, 22 only)
- [ ] Keep Docker and system packages updated

### Configure Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 📊 Monitoring

### Disk Space
```bash
df -h
docker system df
```

### Container Resource Usage
```bash
docker stats
```

### Clean Up Old Docker Data
```bash
docker system prune -a
```

## 🌐 Cloudflare Configuration

1. **SSL/TLS**: Set to "Full" (not "Full (strict)" unless you add origin certificates)
2. **Always Use HTTPS**: ON
3. **Automatic HTTPS Rewrites**: ON
4. **Minimum TLS Version**: 1.2
5. **Browser Cache TTL**: Respect Existing Headers

### Page Rules (Optional)
- Cache everything: `*price-mon.com/*` (for static assets)
- Bypass cache for API: `*price-mon.com/api/*`

## 📝 Environment Variables Reference

### Backend (.env.prod)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Long random string |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Allowed domains | `price-mon.com,www.price-mon.com` |
| `DATABASE_ENGINE` | Database backend | `django.db.backends.postgresql` |
| `POSTGRES_DB` | Database name | `pricemon` |
| `POSTGRES_USER` | Database user | `pricemon_user` |
| `POSTGRES_PASSWORD` | Database password | Strong password |
| `POSTGRES_HOST` | Database host | `postgres` (container name) |
| `POSTGRES_PORT` | Database port | `5432` |
| `CORS_ALLOW_ALL_ORIGINS` | Allow all CORS | `False` |
| `CORS_ALLOWED_ORIGINS` | Specific CORS origins | `https://price-mon.com` |

### Frontend (.env.production)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://price-mon.com/api` |

## 🆘 Support

If you encounter issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables in `.env.prod`
3. Ensure domain DNS is propagated
4. Check Cloudflare SSL settings
5. Verify containers are running: `docker ps`

## 📞 Common Issues

**Issue**: "502 Bad Gateway"
**Solution**: Check if Django container is running and healthy

**Issue**: "Database connection failed"
**Solution**: Verify PostgreSQL credentials in .env.prod

**Issue**: "Frontend shows but API fails"
**Solution**: Check CORS settings and ALLOWED_HOSTS

**Issue**: "Static files not loading"
**Solution**: Run `docker-compose exec django python manage.py collectstatic`
