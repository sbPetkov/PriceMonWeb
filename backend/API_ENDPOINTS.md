# PriceMon Web API Documentation

Base URL: `http://localhost:8000/api`

## Authentication Endpoints

### Register
- **POST** `/auth/register/`
- Body: `{ "email", "password", "password_confirm", "first_name", "last_name", "preferred_currency" }`

### Login
- **POST** `/auth/login/`
- Body: `{ "email", "password" }`
- Returns: `{ "access", "refresh", "user": {...} }`

### Token Refresh
- **POST** `/auth/refresh/`
- Body: `{ "refresh" }`
- Returns: `{ "access", "refresh" }`

### Get Current User
- **GET** `/auth/user/`
- Headers: `Authorization: Bearer <token>`

---

## Product Endpoints

### Categories

#### List Categories
- **GET** `/products/categories/`
- Returns paginated list of all categories with hierarchy info

#### Get Category Tree
- **GET** `/products/categories/tree/`
- Returns hierarchical category tree (parent categories with nested subcategories)

#### Get Category Details
- **GET** `/products/categories/{id}/`

#### Get Products in Category
- **GET** `/products/categories/{id}/products/`
- Returns all approved products in this category (including subcategories)

---

### Stores

#### List Stores
- **GET** `/products/stores/`
- Returns all active stores

#### Get Store Details
- **GET** `/products/stores/{id}/`

#### Get Products at Store
- **GET** `/products/stores/{id}/products/`
- Returns all products that have prices at this store

---

### Products

#### List Products
- **GET** `/products/products/`
- Query params:
  - `search` - Search by name, brand, barcode, description
  - `category` - Filter by category ID
  - `status` - Filter by status (pending/approved/rejected)
  - `ordering` - Sort by field (name, brand, created_at, -created_at)
- Returns: Lightweight product list (ProductListSerializer)
- Non-authenticated users see only approved products
- Authenticated users see approved + their own pending products
- Admins see all products

#### Create Product
- **POST** `/products/products/`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "barcode", "name", "brand", "description", "category_id", "image_url" }`
- Auto-approves for admins or trusted users (trust_score >= 100)

#### Get Product Details
- **GET** `/products/products/{id}/`
- Returns full product details with latest prices and best price

#### Update Product
- **PUT/PATCH** `/products/products/{id}/`
- Headers: `Authorization: Bearer <token>`

#### Delete Product
- **DELETE** `/products/products/{id}/`
- Headers: `Authorization: Bearer <token>`

#### Lookup Product by Barcode
- **GET** `/products/products/lookup_barcode/?barcode=<barcode>`
- Returns: `{ "found": true/false, "status": "approved/pending/rejected", "product": {...} }`

#### Get Product Prices
- **GET** `/products/products/{id}/prices/`
- Query params:
  - `store` - Filter by store ID
  - `page_size` - Results per page (default: 20)
  - `offset` - Pagination offset
- Returns: All approved prices for this product

#### Get Product Price History
- **GET** `/products/products/{id}/price_history/`
- Returns: Price history from last 90 days with statistics (avg, min, count)

#### Approve Product (Admin)
- **POST** `/products/products/{id}/approve/`
- Headers: `Authorization: Bearer <token>`
- Requires: Admin user

#### Reject Product (Admin)
- **POST** `/products/products/{id}/reject/`
- Headers: `Authorization: Bearer <token>`
- Requires: Admin user

---

### Product Prices

#### List Prices
- **GET** `/products/prices/`
- Query params:
  - `product` - Filter by product ID
  - `store` - Filter by store ID
- Headers: `Authorization: Bearer <token>`
- Non-admin users see only approved prices

#### Create Price
- **POST** `/products/prices/`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "product": <id>, "store_id": <id>, "price_entered": <decimal>, "currency_entered": "BGN/EUR" }`
- Rate limit: 30 seconds between submissions
- Auto-converts price to EUR (1 EUR = 1.95583 BGN)

#### Get Price Details
- **GET** `/products/prices/{id}/`
- Headers: `Authorization: Bearer <token>`

#### Verify Price
- **POST** `/products/prices/{id}/verify/`
- Headers: `Authorization: Bearer <token>`
- Increments verified_count
- Cannot verify your own price

#### Approve Price (Admin)
- **POST** `/products/prices/{id}/approve/`
- Headers: `Authorization: Bearer <token>`
- Requires: Admin user

#### Reject Price (Admin)
- **POST** `/products/prices/{id}/reject/`
- Headers: `Authorization: Bearer <token>`
- Requires: Admin user

---

## Response Formats

### Paginated Response
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/products/products/?page=2",
  "previous": null,
  "results": [...]
}
```

### Category Response
```json
{
  "id": 1,
  "name": "Food & Beverages",
  "slug": "food-beverages",
  "parent": null,
  "icon": "🍽️",
  "full_path": "Food & Beverages",
  "is_parent": true,
  "subcategories_count": 10,
  "created_at": "2025-11-05T10:37:13.889660Z"
}
```

### Store Response
```json
{
  "id": 1,
  "name": "Kaufland",
  "chain": "Kaufland",
  "logo_url": "https://...",
  "website": "https://www.kaufland.bg/",
  "primary_color": "#DC143C",
  "is_active": true,
  "created_at": "2025-11-05T10:37:13.899015Z"
}
```

### Product List Response
```json
{
  "id": 1,
  "barcode": "5901234123457",
  "name": "Chocolate Bar",
  "brand": "Milka",
  "category_name": "Snacks & Sweets",
  "image_url": "https://...",
  "status": "approved",
  "best_price": {
    "price_entered": "2.49",
    "currency_entered": "BGN",
    "store": "Kaufland"
  },
  "created_at": "2025-11-05T12:00:00Z"
}
```

### Product Detail Response
```json
{
  "id": 1,
  "barcode": "5901234123457",
  "name": "Chocolate Bar",
  "brand": "Milka",
  "description": "Milk chocolate bar 100g",
  "category": {
    "id": 14,
    "name": "Snacks & Sweets",
    "slug": "snacks-sweets",
    "parent": 1,
    "icon": "🍫",
    "full_path": "Food & Beverages → Snacks & Sweets",
    "is_parent": false,
    "subcategories_count": 0,
    "created_at": "2025-11-05T10:37:13.893190Z"
  },
  "image_url": "https://...",
  "status": "approved",
  "created_by": 1,
  "created_by_email": "user@example.com",
  "latest_prices": [...],
  "best_price": {
    "id": 1,
    "product": 1,
    "store": {...},
    "price_eur": "1.27",
    "price_entered": "2.49",
    "currency_entered": "BGN",
    "status": "approved",
    "is_outlier": false,
    "verified_count": 3,
    "submitted_by": 2,
    "submitted_by_email": "other@example.com",
    "display_price": "2.49 BGN",
    "created_at": "2025-11-05T11:00:00Z",
    "updated_at": "2025-11-05T11:00:00Z"
  },
  "is_approved": true,
  "is_pending": false,
  "created_at": "2025-11-05T10:00:00Z",
  "updated_at": "2025-11-05T10:00:00Z"
}
```

### Product Price Response
```json
{
  "id": 1,
  "product": 1,
  "store": {
    "id": 1,
    "name": "Kaufland",
    "chain": "Kaufland",
    "logo_url": "https://...",
    "website": "https://www.kaufland.bg/",
    "primary_color": "#DC143C",
    "is_active": true,
    "created_at": "2025-11-05T10:37:13.899015Z"
  },
  "price_eur": "1.27",
  "price_entered": "2.49",
  "currency_entered": "BGN",
  "status": "approved",
  "is_outlier": false,
  "verified_count": 3,
  "submitted_by": 2,
  "submitted_by_email": "user@example.com",
  "display_price": "2.49 BGN",
  "created_at": "2025-11-05T11:00:00Z",
  "updated_at": "2025-11-05T11:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Error message",
  "field_name": ["Field-specific error"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "error": "Only admins can approve products"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 429 Too Many Requests
```json
{
  "error": "Please wait 30 seconds between price submissions"
}
```
