# Phase 1 Complete! 🎉

## What's Been Built

### ✅ Backend Setup
- Django 5.1 project initialized
- SQLite database configured
- 4 Django apps created: users, products, shopping, admin_panel
- Custom User model with trust scoring
- JWT authentication configured
- CORS enabled for frontend communication

### ✅ Authentication System
- User registration with validation
- JWT login (access + refresh tokens)
- Token refresh endpoint
- Logout with token blacklisting
- User profile management
- Password change

### ✅ Database
- Custom User model with fields:
  - `preferred_currency` (BGN/EUR)
  - `trust_score` (gamification)
  - `total_products_added`
  - `total_prices_added`
  - `is_admin` (admin flag)
- All migrations applied
- Database ready at `db.sqlite3`

---

## API Endpoints Available

Base URL: `http://localhost:8000/api/auth/`

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Test",
  "last_name": "User",
  "preferred_currency": "BGN"
}

Response 201:
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "preferred_currency": "BGN",
    "trust_score": 0,
    "trust_level": "Bronze",
    "total_products_added": 0,
    "total_prices_added": 0,
    "is_admin": false,
    "created_at": "2025-11-05T11:39:00Z"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "message": "User registered successfully"
}
```

#### 2. Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "testuser",
  "password": "SecurePass123!"
}

Response 200:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    ...
  }
}
```

#### 3. Get Current User Profile
```http
GET /api/auth/me/
Authorization: Bearer <access_token>

Response 200:
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "first_name": "Test",
  "last_name": "User",
  "preferred_currency": "BGN",
  "trust_score": 0,
  "trust_level": "Bronze",
  "total_products_added": 0,
  "total_prices_added": 0,
  "is_admin": false,
  "created_at": "2025-11-05T11:39:00Z"
}
```

#### 4. Update Profile
```http
PATCH /api/auth/me/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Updated",
  "preferred_currency": "EUR"
}

Response 200:
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "first_name": "Updated",
  ...
}
```

#### 5. Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}

Response 200:
{
  "access": "<new_access_token>",
  "refresh": "<new_refresh_token>"
}
```

#### 6. Logout
```http
POST /api/auth/logout/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}

Response 200:
{
  "message": "Logout successful"
}
```

#### 7. Change Password
```http
POST /api/auth/change-password/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "old_password": "SecurePass123!",
  "new_password": "NewSecurePass456!",
  "new_password_confirm": "NewSecurePass456!"
}

Response 200:
{
  "message": "Password changed successfully"
}
```

#### 8. Check Email Exists (Utility)
```http
POST /api/auth/check-email/
Content-Type: application/json

{
  "email": "test@example.com"
}

Response 200:
{
  "exists": true
}
```

---

## Testing the API

### Option 1: Using curl

#### Register a user:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

#### Get Profile (replace TOKEN with access token from login):
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer TOKEN"
```

### Option 2: Using Django Admin

1. Create superuser:
```bash
source venv/bin/activate
python manage.py createsuperuser
```

2. Start server:
```bash
python manage.py runserver
```

3. Visit: http://localhost:8000/admin
4. Login with superuser credentials
5. Browse users in the admin panel

---

## Starting the Development Server

```bash
cd WebVersion/backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python manage.py runserver
```

Server will run at: **http://localhost:8000**

---

## What's Next: Phase 2

Phase 2 will implement:
- Product model (barcode, name, brand, category)
- Category model (hierarchical)
- Store model (Bulgarian stores)
- Product CRUD API endpoints
- Product approval workflow
- Search and filtering

See `DEVELOPMENT_PLAN.md` for details.

---

## Quick Checklist

- [x] Django project initialized
- [x] Custom User model created
- [x] JWT authentication configured
- [x] CORS enabled for frontend
- [x] Migrations applied
- [x] Database created
- [x] 8 authentication endpoints working
- [ ] Superuser created (run `python manage.py createsuperuser`)
- [ ] Server tested (run `python manage.py runserver`)
- [ ] Frontend connected (Phase 1 frontend tasks)

---

## Troubleshooting

### Issue: "Module not found" errors
**Solution**: Make sure venv is activated and dependencies installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: CORS errors from frontend
**Solution**: Frontend must run on http://localhost:5173 (configured in settings.py)

### Issue: "Invalid token" or "Token is blacklisted"
**Solution**: Get a new token by logging in again

---

## Project Structure

```
backend/
├── config/                     # Django project settings
│   ├── settings.py             # ✅ Configured with JWT, CORS, apps
│   └── urls.py                 # ✅ API routes defined
├── users/                      # ✅ User authentication app
│   ├── models.py               # ✅ Custom User model
│   ├── serializers.py          # ✅ API serializers
│   ├── views.py                # ✅ Authentication views
│   ├── urls.py                 # ✅ Auth endpoints
│   └── admin.py                # ✅ Admin configuration
├── products/                   # ⏳ Phase 2
├── shopping/                   # ⏳ Phase 4
├── admin_panel/                # ⏳ Phase 6
├── manage.py                   # Django CLI
├── db.sqlite3                  # ✅ Database (160KB)
└── requirements.txt            # ✅ Dependencies
```

---

## Success! 🚀

Phase 1 authentication backend is complete and ready for testing!

**Next steps:**
1. Create a superuser: `python manage.py createsuperuser`
2. Start server: `python manage.py runserver`
3. Test endpoints with curl or Postman
4. Move to frontend setup (see `frontend/README.md`)
5. Or continue with Phase 2 backend (products)
