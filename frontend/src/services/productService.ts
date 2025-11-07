import api from './api';
import type {
  Category,
  CategoryTree,
  Store,
  Product,
  ProductList,
  ProductPrice,
  ProductCreateRequest,
  ProductPriceCreateRequest,
  BarcodeLookupResponse,
  PriceHistory,
  PaginatedResponse,
} from '../types';

// Categories
export const getCategories = async (): Promise<PaginatedResponse<Category>> => {
  const response = await api.get('/products/categories/');
  return response.data;
};

export const getCategoryTree = async (): Promise<CategoryTree[]> => {
  const response = await api.get('/products/categories/tree/');
  return response.data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await api.get(`/products/categories/${id}/`);
  return response.data;
};

export const getCategoryProducts = async (id: number): Promise<ProductList[]> => {
  const response = await api.get(`/products/categories/${id}/products/`);
  return response.data;
};

// Stores
export interface StoreFilters {
  search?: string;
}

export const getStores = async (filters?: StoreFilters): Promise<PaginatedResponse<Store>> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);

  const response = await api.get(`/products/stores/?${params.toString()}`);
  return response.data;
};

export const createStore = async (store: { name: string; address: string }): Promise<Store> => {
  const response = await api.post('/products/stores/', store);
  return response.data;
};

export const getStoreById = async (id: number): Promise<Store> => {
  const response = await api.get(`/products/stores/${id}/`);
  return response.data;
};

export const getStoreProducts = async (id: number): Promise<ProductList[]> => {
  const response = await api.get(`/products/stores/${id}/products/`);
  return response.data;
};

// Products
export interface ProductFilters {
  search?: string;
  category?: number;
  status?: 'pending' | 'approved' | 'rejected';
  ordering?: string;
  page?: number;
  created_by?: number;
}

export const getProducts = async (
  filters?: ProductFilters
): Promise<PaginatedResponse<ProductList>> => {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.ordering) params.append('ordering', filters.ordering);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.created_by) params.append('created_by', filters.created_by.toString());

  const response = await api.get(`/products/products/?${params.toString()}`);
  return response.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const response = await api.get(`/products/products/${id}/`);
  return response.data;
};

export const createProduct = async (
  product: ProductCreateRequest
): Promise<Product> => {
  const response = await api.post('/products/products/', product);
  return response.data;
};

export const updateProduct = async (
  id: number,
  product: Partial<ProductCreateRequest>
): Promise<Product> => {
  const response = await api.patch(`/products/products/${id}/`, product);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/products/${id}/`);
};

export const lookupBarcode = async (
  barcode: string
): Promise<BarcodeLookupResponse> => {
  const response = await api.get(
    `/products/products/lookup_barcode/?barcode=${barcode}`
  );
  return response.data;
};

export const getProductPrices = async (
  productId: number,
  storeId?: number,
  pageSize: number = 20,
  offset: number = 0
): Promise<ProductPrice[]> => {
  const params = new URLSearchParams();
  if (storeId) params.append('store', storeId.toString());
  params.append('page_size', pageSize.toString());
  params.append('offset', offset.toString());

  const response = await api.get(
    `/products/products/${productId}/prices/?${params.toString()}`
  );
  return response.data;
};

export const getProductPriceHistory = async (
  productId: number,
  period: 'week' | 'month' | 'all' = 'all'
): Promise<PriceHistory> => {
  const response = await api.get(`/products/products/${productId}/price_history/?period=${period}`);
  return response.data;
};

export const approveProduct = async (id: number): Promise<Product> => {
  const response = await api.post(`/products/products/${id}/approve/`);
  return response.data.product;
};

export const rejectProduct = async (id: number): Promise<Product> => {
  const response = await api.post(`/products/products/${id}/reject/`);
  return response.data.product;
};

// Product Prices
export interface PriceFilters {
  product?: number;
  store?: number;
}

export const getPrices = async (
  filters?: PriceFilters
): Promise<PaginatedResponse<ProductPrice>> => {
  const params = new URLSearchParams();
  if (filters?.product) params.append('product', filters.product.toString());
  if (filters?.store) params.append('store', filters.store.toString());

  const response = await api.get(`/products/prices/?${params.toString()}`);
  return response.data;
};

export const createPrice = async (
  price: ProductPriceCreateRequest
): Promise<ProductPrice> => {
  const response = await api.post('/products/prices/', price);
  return response.data;
};

// Verification moved to userActivityService.ts
// Use verifyPrice from userActivityService instead

export const approvePrice = async (id: number): Promise<ProductPrice> => {
  const response = await api.post(`/products/prices/${id}/approve/`);
  return response.data.price;
};

export const rejectPrice = async (id: number): Promise<ProductPrice> => {
  const response = await api.post(`/products/prices/${id}/reject/`);
  return response.data.price;
};

// Favorites
export const toggleFavorite = async (productId: number): Promise<{ is_favorite: boolean; message: string }> => {
  const response = await api.post(`/products/products/${productId}/toggle_favorite/`);
  return response.data;
};

export const getFavorites = async (): Promise<ProductList[]> => {
  const response = await api.get(`/products/products/favorites/`);
  return response.data;
};
