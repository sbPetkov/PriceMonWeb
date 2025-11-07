// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  preferred_currency: 'BGN' | 'EUR';
  trust_score: number;
  trust_level: 'Bronze' | 'Silver' | 'Gold';
  total_products_added: number;
  total_prices_added: number;
  is_admin: boolean;
  created_at: string;
}

// Authentication types
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  preferred_currency?: 'BGN' | 'EUR';
}

export interface TokenRefreshResponse {
  access: string;
  refresh: string;
}

// API Error types
export interface APIError {
  [key: string]: string[] | string;
}

export interface APIErrorResponse {
  detail?: string;
  error?: string;
  non_field_errors?: string[];
  [key: string]: any;
}

// Form field error type
export type FieldErrors<T> = {
  [K in keyof T]?: string;
};

// Product types (Phase 2)
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  icon: string;
  full_path: string;
  is_parent: boolean;
  subcategories_count: number;
  created_at: string;
}

export interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  icon: string;
  subcategories: CategoryTree[];
}

export interface Store {
  id: number;
  name: string;
  chain: string;
  address?: string;
  city?: string;
  logo_url: string | null;
  website: string | null;
  primary_color: string;
  is_active: boolean;
  created_at: string;
}

export interface BestPrice {
  price_entered: string;
  currency_entered: 'BGN' | 'EUR';
  store: string;
}

export interface ProductList {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  category_name: string;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  best_price: BestPrice | null;
  created_at: string;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  description: string;
  category: Category;
  category_id?: number;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_by: number;
  created_by_email: string;
  latest_prices: ProductPrice[];
  best_price: ProductPrice | null;
  is_approved: boolean;
  is_pending: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPrice {
  id: number;
  product: number;
  store: Store;
  store_id?: number;
  price_eur: string;
  price_entered: string;
  currency_entered: 'BGN' | 'EUR';
  status: 'pending' | 'approved' | 'rejected';
  is_outlier: boolean;
  is_flagged?: boolean; // Backend returns this on create to indicate if price was flagged
  positive_votes: number;
  negative_votes: number;
  submitted_by: number;
  submitted_by_email: string;
  display_price: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateRequest {
  barcode: string;
  name: string;
  brand: string;
  description?: string;
  category_id?: number;
  image_url?: string;
}

export interface ProductPriceCreateRequest {
  product: number;
  store_id: number;
  price_entered: string;
  currency_entered: 'BGN' | 'EUR';
}

export interface BarcodeLookupResponse {
  found: boolean;
  status?: 'approved' | 'pending' | 'rejected';
  product?: Product;
  message?: string;
}

export interface DailyMedian {
  date: string; // ISO date string
  median_price_eur: number;
  count: number;
}

export interface PriceHistory {
  daily_medians: DailyMedian[];
  all_prices: ProductPrice[];
  statistics: {
    average_price: number | null;
    lowest_price: number | null;
    highest_price: number | null;
    total_submissions: number;
    period: 'week' | 'month' | 'all';
  };
}

// Shopping list types (Phase 4)
export interface ShoppingList {
  id: number;
  name: string;
  owner: User;
  members: ShoppingListMember[];
  items: ShoppingListItem[];
  item_count: number;
  checked_count: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListListItem {
  id: number;
  name: string;
  owner: User;
  member_count: number;
  item_count: number;
  checked_count: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: number;
  product?: number;
  product_details?: ProductList;
  custom_name?: string;
  name: string;
  quantity: number;
  checked: boolean;
  added_by: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListMember {
  id: number;
  user: User;
  role: 'owner' | 'editor';
  added_at: string;
}

export interface ShoppingListCreateRequest {
  name: string;
}

export interface ShoppingListItemCreateRequest {
  product_id?: number;
  custom_name?: string;
  quantity: number;
}

export interface StoreComparison {
  total_items: number;
  stores: Array<{
    store_id: number;
    store_name: string;
    store_address?: string;
    store_city?: string;
    total_price_eur: number;
    total_price_bgn: number;
    items_with_prices: number;
    items_without_prices: string[];
    coverage_percent: number;
  }>;
  items?: Array<{
    id: number;
    name: string;
    brand?: string;
    quantity: number;
    is_custom: boolean;
    store_prices: Record<number, number | null>; // store_id -> price_eur
  }>;
}

// Pagination types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Common component prop types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Scan History types (Phase 5)
export interface ScanHistory {
  id: number;
  product: ProductList;
  product_id: number;
  barcode: string;
  scan_type: 'camera' | 'manual';
  scanned_at: string;
}

export interface ScanHistoryCreateRequest {
  product_id: number;
  barcode: string;
  scan_type?: 'camera' | 'manual';
}

// Price Verification types (Phase 5)
export interface PriceVerification {
  id: number;
  price: number;
  vote_type: 'positive' | 'negative';
  user_email: string;
  verified_at: string;
}

// Price Report types (Phase 5)
export interface PriceReport {
  id: number;
  price: number;
  reason: 'too_high' | 'too_low' | 'wrong_product' | 'wrong_store' | 'outdated' | 'duplicate' | 'other';
  reason_display: string;
  comment: string;
  reported_by_email: string;
  reported_at: string;
}

export interface PriceReportCreateRequest {
  reason: 'too_high' | 'too_low' | 'wrong_product' | 'wrong_store' | 'outdated' | 'duplicate' | 'other';
  comment?: string;
}
