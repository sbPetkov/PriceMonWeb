# PriceMon Web Version

Django + React web application for tracking product prices across Bulgarian stores.

This is a proof-of-concept web version of the PriceMon mobile app, designed to validate market demand before investing in mobile app store fees.

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Setup Backend
```bash
cd WebVersion/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialize Django (first time only)
django-admin startproject config .
python manage.py migrate
python manage.py createsuperuser

# Run server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Setup Frontend
```bash
cd WebVersion/frontend

# Initialize Vite project (first time only)
npm create vite@latest . -- --template react-ts
npm install

# Install additional dependencies
npm install react-router-dom axios tailwindcss postcss autoprefixer
npm install html5-qrcode chart.js react-chartjs-2 date-fns lucide-react
npx tailwindcss init -p

# Run dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Project Structure

```
WebVersion/
├── backend/                # Django REST API
│   ├── venv/               # Python virtual environment
│   ├── config/             # Django settings
│   ├── users/              # User authentication
│   ├── products/           # Products, prices, stores
│   ├── shopping/           # Shopping lists
│   ├── admin_panel/        # Admin workflows
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3          # SQLite database
│
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── DEVELOPMENT_PLAN.md     # Detailed 6-phase plan
└── README.md               # This file
```

---

## Development Plan Overview

### ✅ Phase 1: Foundation & Authentication (Week 1-2)
- Django project setup with SQLite
- User authentication (JWT tokens)
- React app with login/signup pages
- Protected routes

### 🔄 Phase 2: Products & Categories (Week 2-3)
- Product, Category, Store models
- Product CRUD API
- Product search and filtering
- Approval workflow

### ⏳ Phase 3: Barcode Scanner & Prices (Week 3-4)
- Browser-based barcode scanner (html5-qrcode)
- Price submission with validation
- Currency conversion (BGN/EUR)
- Price history with charts

### ⏳ Phase 4: Shopping Lists & Collaboration (Week 4-5)
- Collaborative shopping lists
- Invite members by email
- Store comparison feature
- Real-time updates (polling or WebSocket)

### ⏳ Phase 5: User Features & Gamification (Week 5-6)
- Favorites system
- Scan history
- Trust scoring
- Price verification
- Leaderboard

### ⏳ Phase 6: Admin Dashboard & Polish (Week 6-8)
- Admin approval dashboard
- Product/price review queues
- Performance optimization
- PWA setup (optional)
- Production deployment

See `DEVELOPMENT_PLAN.md` for detailed tasks and deliverables.

---

## Key Features

### Core Features
- User authentication with JWT
- Barcode scanning (browser-based)
- Product price tracking
- Multi-currency support (BGN/EUR)
- Price trend visualization
- Collaborative shopping lists
- Store comparison

### Advanced Features
- Price outlier detection
- User trust scoring system
- Community price verification
- Admin approval workflows
- Real-time updates
- Gamification (leaderboards)

---

## Technology Stack

### Backend
- **Framework**: Django 5.1
- **API**: Django REST Framework
- **Database**: SQLite (can migrate to PostgreSQL later)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **CORS**: django-cors-headers

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: react-router-dom
- **HTTP Client**: axios
- **Styling**: Tailwind CSS
- **Barcode Scanner**: html5-qrcode
- **Charts**: Chart.js

---

## Architecture

### Data Flow
1. User scans barcode in browser
2. Frontend sends barcode to backend API
3. Backend looks up product in database
4. If found: return product details
5. If not found: user can add new product
6. User submits price for product
7. Backend validates price (outlier detection)
8. Price stored in EUR (converted from BGN if needed)
9. Other users can verify or report prices

### Authentication
- JWT tokens (access + refresh)
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Tokens stored in localStorage
- Axios interceptor handles token refresh

### Currency Handling
- All prices stored in EUR in database
- User can enter price in BGN or EUR
- Fixed conversion rate: 1 EUR = 1.95583 BGN
- Display in user's preferred currency

### Approval Workflow
- New products default to "pending" status
- Admins or trusted users (trust_score >= 100) auto-approve
- Prices validated against historical data
- Outliers flagged for admin review
- Trusted users (trust_score >= 50) auto-approved

---

## Database Schema

### Core Tables
- **users** - Extended user model with trust_score, preferred_currency, is_admin
- **categories** - Hierarchical categories (parent-child)
- **stores** - Bulgarian store chains
- **products** - Barcode, name, brand, category, status
- **product_prices** - Price, store, user, timestamps, outlier flag
- **shopping_lists** - List name, owner
- **shopping_list_members** - List permissions (owner/editor)
- **shopping_list_items** - Product or custom item, quantity, checked
- **user_favorites** - User's favorite products
- **scan_history** - User's barcode scan log
- **price_verifications** - Community verification
- **price_reports** - Suspicious price reports
- **admin_actions** - Audit log for admin actions

---

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login (returns JWT tokens)
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user

### Products
- `GET /api/products/` - List products (search, filter)
- `GET /api/products/:id/` - Product details
- `POST /api/products/` - Create product
- `GET /api/products/lookup/:barcode/` - Lookup by barcode

### Prices
- `POST /api/prices/` - Submit price
- `GET /api/prices/?product_id=X` - Price history
- `POST /api/prices/:id/verify/` - Verify price
- `POST /api/prices/:id/report/` - Report price

### Shopping Lists
- `GET /api/shopping-lists/` - User's lists
- `POST /api/shopping-lists/` - Create list
- `GET /api/shopping-lists/:id/` - List details
- `POST /api/shopping-lists/:id/items/` - Add item
- `POST /api/shopping-lists/:id/compare/` - Compare stores

### Admin
- `GET /api/admin/pending-products/` - Pending products
- `POST /api/admin/products/:id/approve/` - Approve product

---

## Hardware Requirements

### Development
- Any modern laptop/desktop
- 4GB RAM minimum
- 10GB free disk space

### Production (Home Server)
- **Tested on**: Pentium 4, 4GB RAM, 1TB HDD
- **Expected performance**: 20-50 concurrent users
- **Response time**: 200-500ms
- **Recommendations**:
  - Use SQLite for <1000 users
  - Migrate to PostgreSQL if you grow
  - Enable caching (Redis) if needed
  - Use Cloudflare for CDN and DDoS protection

---

## Deployment (Production)

### 🐳 Docker Deployment (Recommended)

The application is now ready for production deployment with Docker, Nginx, and PostgreSQL.

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.**

### Quick Deploy
```bash
# On your VPS
cd WebVersion
./deploy.sh
```

### Architecture
- **3 Docker Containers**: Nginx (frontend + proxy), Django (backend), PostgreSQL (database)
- **Cloudflare**: DNS + SSL (Full mode)
- **VPS**: Self-managed server
- **Database**: PostgreSQL with persistent volumes

### Key Files
- `docker-compose.prod.yml` - Production compose configuration
- `docker-compose.dev.yml` - Development compose configuration
- `deploy.sh` - Automated deployment script
- `backup_db.sh` - Database backup script
- `DEPLOYMENT.md` - Complete deployment guide

### Environment Setup
1. Create `backend/.env.prod` from `.env.sample`
2. Create `frontend/.env.production`
3. Configure Cloudflare DNS
4. Run `./deploy.sh`

### Security
- HTTPS via Cloudflare (Full SSL mode)
- Django SECRET_KEY in environment variables
- DEBUG=False in production
- CORS restricted to your domain
- PostgreSQL with strong password
- Regular automated backups

---

## Cost Comparison

### Mobile App (Original Plan)
- Apple Developer Account: $99/year
- Google Play Console: $25 one-time
- Expo API limits: $29+/month after 100k API calls
- Supabase limits: $25/month after free tier
- **Total Year 1**: ~$500+

### Web App (This Project)
- Domain name: $10-15/year (optional, use dynamic DNS)
- SSL certificate: Free (Let's Encrypt)
- Server: Home laptop (electricity ~$5-10/month)
- **Total Year 1**: ~$70-135

**Savings**: ~$400-430 in first year!

---

## Success Metrics

### Technical Goals
- ✅ Response time < 500ms
- ✅ Barcode scanner works in Chrome, Firefox, Safari
- ✅ Supports 20-50 concurrent users
- ✅ 95%+ uptime

### Business Goals
- 🎯 100+ registered users in first month
- 🎯 500+ products in database
- 🎯 1000+ price submissions
- 🎯 50+ weekly active users

**If you hit these → Invest in mobile app!**

---

## Contributing

This is a personal project, but issues and suggestions are welcome!

---

## License

Private project - All rights reserved.

---

## Next Steps

1. ✅ Read `DEVELOPMENT_PLAN.md` for detailed phase breakdown
2. ⏳ Set up backend (Phase 1)
3. ⏳ Set up frontend (Phase 1)
4. ⏳ Build authentication flow
5. ⏳ Continue through phases 2-6

**Ready to start? Begin with Phase 1 in `DEVELOPMENT_PLAN.md`!**
