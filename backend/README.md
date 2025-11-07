# PriceMon Backend (Django)

Django REST API backend for PriceMon web application.

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd WebVersion/backend
python3 -m venv venv
```

### 2. Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Initialize Django Project (First Time Only)

```bash
# Create Django project
django-admin startproject config .

# Create apps
python manage.py startapp users
python manage.py startapp products
python manage.py startapp shopping
python manage.py startapp admin_panel
```

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

### 7. Run Development Server

```bash
python manage.py runserver
```

API will be available at: `http://localhost:8000`

---

## Project Structure

```
backend/
├── venv/                   # Virtual environment (not in git)
├── config/                 # Django project settings
│   ├── settings.py         # Main settings
│   ├── urls.py             # Root URL configuration
│   └── wsgi.py             # WSGI configuration
├── users/                  # User authentication & profiles
│   ├── models.py           # User, UserProfile models
│   ├── views.py            # API views
│   ├── serializers.py      # DRF serializers
│   └── urls.py             # User endpoints
├── products/               # Products, prices, categories, stores
│   ├── models.py           # Product, Price, Category, Store models
│   ├── views.py            # API views
│   ├── serializers.py      # DRF serializers
│   └── urls.py             # Product endpoints
├── shopping/               # Shopping lists
│   ├── models.py           # ShoppingList, ListItem, ListMember models
│   ├── views.py            # API views
│   ├── serializers.py      # DRF serializers
│   └── urls.py             # Shopping list endpoints
├── admin_panel/            # Admin approval workflows
│   ├── models.py           # AdminAction model
│   ├── views.py            # Admin API views
│   └── urls.py             # Admin endpoints
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
└── db.sqlite3              # SQLite database (not in git)
```

---

## Environment Variables

Create a `.env` file in the backend root:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
DATABASE_URL=sqlite:///db.sqlite3
```

---

## API Endpoints (Planned)

### Authentication
- POST `/api/auth/register/` - User registration
- POST `/api/auth/login/` - User login (returns JWT tokens)
- POST `/api/auth/logout/` - User logout
- POST `/api/auth/refresh/` - Refresh access token
- GET `/api/auth/me/` - Get current user profile

### Products
- GET `/api/products/` - List products (search, filter)
- GET `/api/products/:id/` - Product details
- POST `/api/products/` - Create product
- GET `/api/products/lookup/:barcode/` - Lookup by barcode
- GET `/api/categories/` - List categories
- GET `/api/stores/` - List stores

### Prices
- POST `/api/prices/` - Submit price
- GET `/api/prices/?product_id=X` - Price history
- GET `/api/prices/best/` - Best prices (batch)
- POST `/api/prices/:id/verify/` - Verify price
- POST `/api/prices/:id/report/` - Report price

### Shopping Lists
- GET `/api/shopping-lists/` - User's lists
- POST `/api/shopping-lists/` - Create list
- GET `/api/shopping-lists/:id/` - List details
- POST `/api/shopping-lists/:id/items/` - Add item
- POST `/api/shopping-lists/:id/compare/` - Compare stores

### Favorites & History
- GET `/api/favorites/` - User favorites
- POST `/api/favorites/` - Add favorite
- DELETE `/api/favorites/:productId/` - Remove favorite
- GET `/api/scan-history/` - Scan history

### Admin
- GET `/api/admin/pending-products/` - Pending products
- POST `/api/admin/products/:id/approve/` - Approve product
- GET `/api/admin/pending-prices/` - Pending prices
- POST `/api/admin/prices/:id/approve/` - Approve price

---

## Development Workflow

### Phase 1: Authentication (Current)
1. Set up custom User model
2. Configure JWT authentication
3. Create registration/login endpoints
4. Test with Postman or curl

### Phase 2: Products
1. Create Product, Category, Store models
2. Seed initial data
3. Build CRUD endpoints
4. Test product creation and approval

### Phase 3: Prices & Scanner
1. Create ProductPrice model
2. Implement price validation logic
3. Build price submission endpoints
4. Test outlier detection

### Phase 4: Shopping Lists
1. Create shopping list models
2. Implement collaborative features
3. Build store comparison logic

### Phase 5: User Features
1. Add favorites system
2. Implement trust scoring
3. Build gamification features

### Phase 6: Admin & Polish
1. Create admin dashboard
2. Optimize queries
3. Add rate limiting

---

## Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test products

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

---

## Database Commands

```bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Rollback migration
python manage.py migrate products 0001

# Show migrations
python manage.py showmigrations

# Create superuser
python manage.py createsuperuser

# Django shell (interactive)
python manage.py shell
```

---

## Useful Django Commands

```bash
# Check for problems
python manage.py check

# Collect static files (production)
python manage.py collectstatic

# Create database backup
python manage.py dumpdata > backup.json

# Load database backup
python manage.py loaddata backup.json

# Start new app
python manage.py startapp app_name
```

---

## Production Deployment (Phase 6)

### Requirements
```bash
pip install gunicorn
pip freeze > requirements.txt
```

### Gunicorn Configuration
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /path/to/static/;
    }
}
```

---

## Troubleshooting

### Issue: Import errors after creating apps
**Solution**: Add apps to `INSTALLED_APPS` in `config/settings.py`

### Issue: CORS errors from frontend
**Solution**: Check `CORS_ALLOWED_ORIGINS` in settings

### Issue: JWT token expired
**Solution**: Use refresh token endpoint to get new access token

### Issue: Database locked (SQLite)
**Solution**: Close other connections, or migrate to PostgreSQL

---

## Next Steps

1. Follow Phase 1 setup instructions
2. Run migrations
3. Test authentication endpoints
4. Move to Phase 2 (Products)

See `../DEVELOPMENT_PLAN.md` for detailed phase-by-phase guide.
