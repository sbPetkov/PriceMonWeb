# PriceMon Frontend (React)

React + TypeScript + Vite frontend for PriceMon web application.

## Setup Instructions

### 1. Initialize Vite Project (First Time Only)

```bash
cd WebVersion/frontend
npm create vite@latest . -- --template react-ts
```

When prompted, select:
- Framework: **React**
- Variant: **TypeScript**

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Additional Packages

```bash
# Routing
npm install react-router-dom

# HTTP client
npm install axios

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Barcode scanner
npm install html5-qrcode

# Charts (for price trends)
npm install chart.js react-chartjs-2

# Date formatting
npm install date-fns

# Icons (optional)
npm install lucide-react
```

### 4. Configure Tailwind CSS

Update `tailwind.config.js` with Bulgarian theme colors (see below).

### 5. Run Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## Project Structure

```
frontend/
├── node_modules/           # Dependencies (not in git)
├── public/                 # Static assets
│   └── favicon.ico
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Buttons, inputs, modals
│   │   ├── product/        # ProductCard, ProductList
│   │   ├── scanner/        # BarcodeScanner component
│   │   └── layout/         # Header, Footer, Sidebar
│   ├── pages/              # Route pages
│   │   ├── auth/           # Login, Signup, ForgotPassword
│   │   ├── Home.tsx        # Home/Favorites page
│   │   ├── ProductList.tsx # Product catalog
│   │   ├── ProductDetails.tsx
│   │   ├── Scanner.tsx     # Barcode scanner page
│   │   ├── ShoppingLists.tsx
│   │   ├── Profile.tsx
│   │   └── admin/          # Admin dashboard pages
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── services/           # API client
│   │   ├── api.ts          # Axios instance
│   │   ├── authService.ts  # Auth API calls
│   │   ├── productService.ts
│   │   ├── priceService.ts
│   │   └── shoppingService.ts
│   ├── utils/              # Helper functions
│   │   ├── currency.ts     # BGN/EUR conversion
│   │   ├── validation.ts   # Form validation
│   │   └── priceValidation.ts  # Outlier detection
│   ├── types/              # TypeScript definitions
│   │   └── index.ts        # All type definitions
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useDebounce.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles (Tailwind)
├── .env                    # Environment variables
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── tailwind.config.js      # Tailwind config
```

---

## Tailwind Configuration

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bulgarian theme colors
        primary: '#DC143C',      // Bulgarian red
        secondary: '#2E7D32',    // Green (savings)
        background: '#F5F5F5',   // Light gray
        surface: '#FFFFFF',      // White
        text: {
          primary: '#212121',
          secondary: '#757575',
        },
        price: {
          up: '#D32F2F',         // Red (price increased)
          down: '#2E7D32',       // Green (price decreased)
          stable: '#757575',     // Gray (stable)
        },
        status: {
          pending: '#FF9800',    // Orange
          approved: '#4CAF50',   // Green
          rejected: '#F44336',   // Red
        },
      },
    },
  },
  plugins: [],
}
```

---

## Environment Variables

Create `.env` file in frontend root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Access in code:
```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## Key Components to Build

### Phase 1: Authentication
- `AuthContext.tsx` - Global auth state
- `ProtectedRoute.tsx` - Route guard
- `Login.tsx` - Login page
- `Signup.tsx` - Registration page
- `ForgotPassword.tsx` - Password reset

### Phase 2: Products
- `ProductList.tsx` - Product catalog with search
- `ProductCard.tsx` - Product display component
- `ProductDetails.tsx` - Product detail page
- `AddProduct.tsx` - Create product form

### Phase 3: Scanner & Prices
- `BarcodeScanner.tsx` - Camera-based scanner
- `AddPrice.tsx` - Price submission form
- `PriceHistory.tsx` - Price chart component

### Phase 4: Shopping Lists
- `ShoppingLists.tsx` - List of user's lists
- `ShoppingListDetail.tsx` - List items view
- `StoreComparison.tsx` - Compare prices

### Phase 5: User Features
- `Home.tsx` - Favorites dashboard
- `Profile.tsx` - User profile page
- `ScanHistory.tsx` - Scan history list

### Phase 6: Admin
- `AdminDashboard.tsx` - Admin overview
- `PendingProducts.tsx` - Product approval queue
- `PendingPrices.tsx` - Price approval queue

---

## TypeScript Types

Create `src/types/index.ts`:

```typescript
// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  trust_score: number;
  preferred_currency: 'BGN' | 'EUR';
  is_admin: boolean;
  total_products_added: number;
  created_at: string;
}

// Product types
export interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  category: Category;
  status: 'pending' | 'approved' | 'rejected';
  created_by: User;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
}

export interface Store {
  id: number;
  name: string;
  chain: string;
  logo_url?: string;
}

// Price types
export interface ProductPrice {
  id: number;
  product: Product;
  store: Store;
  price_eur: number;
  price_entered: number;
  currency_entered: 'BGN' | 'EUR';
  status: 'pending' | 'approved';
  is_outlier: boolean;
  verified_count: number;
  submitted_by: User;
  created_at: string;
}

// Shopping list types
export interface ShoppingList {
  id: number;
  name: string;
  owner: User;
  created_at: string;
  items: ShoppingListItem[];
  members: ShoppingListMember[];
}

export interface ShoppingListItem {
  id: number;
  product?: Product;
  custom_name?: string;
  quantity: number;
  checked: boolean;
}

export interface ShoppingListMember {
  id: number;
  user: User;
  role: 'owner' | 'editor';
}

// API response types
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

---

## API Service Example

Create `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Routing Example

Create `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';
import ShoppingLists from './pages/ShoppingLists';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
          <Route path="/lists" element={<ProtectedRoute><ShoppingLists /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## Development Workflow

### Phase 1: Authentication (Current)
1. Set up routing with React Router
2. Create AuthContext with login/signup/logout
3. Build login and signup forms
4. Test authentication flow with backend

### Phase 2: Products
1. Create product list page with search
2. Build product detail page
3. Create add product form
4. Test product CRUD operations

### Phase 3: Scanner
1. Integrate html5-qrcode library
2. Build camera scanner component
3. Handle barcode scan results
4. Create price submission form

### Phase 4: Shopping Lists
1. Create shopping list management pages
2. Build collaborative features
3. Implement store comparison

### Phase 5: User Features
1. Build favorites page
2. Create profile page
3. Add scan history

### Phase 6: Admin & Polish
1. Create admin dashboard
2. Add loading states and error handling
3. Implement responsive design
4. Set up PWA (optional)

---

## Building for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

Build output goes to `dist/` folder, ready to serve with Nginx.

---

## Deployment (Phase 6)

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
    index index.html;

    # React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Troubleshooting

### Issue: CORS errors when calling backend
**Solution**: Ensure backend has CORS configured for `http://localhost:5173`

### Issue: Camera not working in scanner
**Solution**: Must use HTTPS (or localhost). Chrome requires secure context.

### Issue: TypeScript errors
**Solution**: Check `tsconfig.json` and ensure types are installed

### Issue: Build fails with memory error (on Pentium 4)
**Solution**: Increase Node memory: `NODE_OPTIONS=--max-old-space-size=2048 npm run build`

---

## Performance Tips (Low-End Hardware)

- Use React.lazy() for code splitting
- Implement pagination (25 items per page)
- Debounce search inputs (300ms)
- Optimize images (use WebP, compress)
- Lazy load images with Intersection Observer
- Use production build (minified)

---

## Next Steps

1. Follow Phase 1 setup instructions
2. Create AuthContext and login page
3. Test authentication with backend
4. Move to Phase 2 (Products)

See `../DEVELOPMENT_PLAN.md` for detailed phase-by-phase guide.
