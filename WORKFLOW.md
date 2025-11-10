# Development to Production Workflow

Quick reference guide from local development to production deployment.

## 🖥️ Local Development

### Start Development Servers

```bash
# Terminal 1 - Backend
cd WebVersion/backend
source venv/bin/activate  # or: venv\Scripts\activate on Windows
python manage.py runserver

# Terminal 2 - Frontend
cd WebVersion/frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin: http://localhost:8000/admin

### Make Changes & Test Locally

1. Edit code
2. Test in browser
3. Check console for errors
4. Test API endpoints

---

## 📤 Push to Git

### First Time Setup (if needed)

```bash
cd /Users/Projects/PriceMon3
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/pricemon.git
git push -u origin main
```

### Regular Updates

```bash
cd /Users/Projects/PriceMon3/WebVersion

# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

---

## 🌐 Cloudflare Setup (Do This First - Before Server)

### 1. Add Domain to Cloudflare

1. Login to cloudflare.com
2. Click "Add a site"
3. Enter: `price-mon.com`
4. Select Free plan
5. Copy the 2 nameservers Cloudflare gives you

### 2. Update Domain Registrar

Go to where you bought `price-mon.com` and:
1. Find DNS/Nameserver settings
2. Replace nameservers with Cloudflare's
3. Wait 5-30 minutes for propagation

### 3. Configure DNS in Cloudflare

**DNS Records:**
```
Type: A
Name: @
Content: YOUR_VPS_IP
Proxy: ON (orange cloud)

Type: A
Name: www
Content: YOUR_VPS_IP
Proxy: ON (orange cloud)
```

### 4. SSL/TLS Settings

- Go to SSL/TLS tab
- Set mode to: **Full**
- Enable: Always Use HTTPS
- Enable: Automatic HTTPS Rewrites

### 5. Speed Settings (Optional)

- Caching → Caching Level: Standard
- Auto Minify: Enable all (HTML, CSS, JS)

**Done! Wait 10-15 minutes for DNS propagation**

---

## 🖥️ Server Setup (First Time Only)

### SSH into VPS

```bash
ssh root@YOUR_VPS_IP
# or: ssh user@YOUR_VPS_IP
```

### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version

# Logout and login again for docker group to take effect
exit
ssh root@YOUR_VPS_IP
```

### Setup Firewall

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Clone Repository

```bash
# Create directory
sudo mkdir -p /var/www/pricemon
sudo chown $USER:$USER /var/www/pricemon
cd /var/www/pricemon

# Clone from GitHub
git clone https://github.com/yourusername/pricemon.git .
```

### Create Production Environment

```bash
cd /var/www/pricemon/WebVersion/backend

# Copy sample and edit
cp .env.sample .env.prod
nano .env.prod
```

**Edit these values:**
```env
SECRET_KEY=<run: python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'>
DEBUG=False
ALLOWED_HOSTS=price-mon.com,www.price-mon.com,192.168.1.15

DATABASE_ENGINE=django.db.backends.postgresql
POSTGRES_DB=pricemon
POSTGRES_USER=pricemon_user
POSTGRES_PASSWORD=.......
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://price-mon.com,https://www.price-mon.com
FRONTEND_URL=https://price-mon.com
```

Save: `Ctrl+O`, Exit: `Ctrl+X`

### Initial Deployment

```bash
cd /var/www/pricemon/WebVersion
chmod +x deploy.sh backup_db.sh
./deploy.sh
```

**Wait 2-3 minutes for build...**

### Create Admin User

```bash
docker-compose -f docker-compose.prod.yml exec django python manage.py createsuperuser
```

**Test:**
- Frontend: http://YOUR_VPS_IP
- Admin: http://YOUR_VPS_IP/admin
- After DNS: https://price-mon.com

---

## 🔄 Regular Updates (After Code Changes)

### On Local Machine

```bash
cd /Users/Projects/PriceMon3/WebVersion
git add .
git commit -m "Update: description of changes"
git push origin main
```

### On Server

```bash
# SSH to server
ssh root@YOUR_VPS_IP

# Pull latest code
cd /var/www/pricemon/
git pull origin main

# If you changed backend code (Python/Django):
./deploy.sh

# If you ONLY changed frontend (React):
cd frontend
npm install  # if package.json changed
npm run build
docker-compose -f ../docker-compose.prod.yml restart nginx
```

---

## 🛠️ Common Commands

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

# Restart one
docker-compose -f docker-compose.prod.yml restart django
```

### Stop/Start

```bash
# Stop all containers
docker-compose -f docker-compose.prod.yml down

# Start all containers
docker-compose -f docker-compose.prod.yml up -d
```

### Database Commands

```bash
# Backup database
./backup_db.sh

# Access PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U pricemon_user -d pricemon

# Run migrations
docker-compose -f docker-compose.prod.yml exec django python manage.py migrate

# Django shell
docker-compose -f docker-compose.prod.yml exec django python manage.py shell
```

### Check Status

```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Disk space
df -h
docker system df
```

---

## 🚨 Troubleshooting

### Site not loading

```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### API errors (502 Bad Gateway)

```bash
# Check Django logs
docker-compose -f docker-compose.prod.yml logs django

# Check if Django is healthy
docker-compose -f docker-compose.prod.yml exec django python manage.py check

# Restart Django
docker-compose -f docker-compose.prod.yml restart django
```

### Database connection issues

```bash
# Check PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres

# Verify credentials in .env.prod
cat backend/.env.prod | grep POSTGRES

# Restart postgres
docker-compose -f docker-compose.prod.yml restart postgres
```

### Static files not loading

```bash
# Collect static files
docker-compose -f docker-compose.prod.yml exec django python manage.py collectstatic --noinput

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 📊 Quick Reference

| Action | Command |
|--------|---------|
| Deploy | `./deploy.sh` |
| Backup DB | `./backup_db.sh` |
| View logs | `docker-compose -f docker-compose.prod.yml logs -f` |
| Restart all | `docker-compose -f docker-compose.prod.yml restart` |
| Stop all | `docker-compose -f docker-compose.prod.yml down` |
| Start all | `docker-compose -f docker-compose.prod.yml up -d` |
| Shell access | `docker-compose -f docker-compose.prod.yml exec django bash` |

---

## 🔄 Typical Development Cycle

```bash
# 1. Local development
cd WebVersion/backend && python manage.py runserver
cd WebVersion/frontend && npm run dev

# 2. Make changes, test locally

# 3. Commit and push
git add .
git commit -m "Feature: description"
git push origin main

# 4. On server
ssh root@YOUR_VPS_IP
cd /var/www/pricemon/WebVersion
git pull origin main
./deploy.sh

# Done!
```
