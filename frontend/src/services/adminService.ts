import api from './api';
import type { Product, ProductPrice } from '../types';

// Extended types for admin views with submitter details
export interface PendingProductWithSubmitter extends Product {
  creator_trust_score: number;
  creator_trust_level: 'Bronze' | 'Silver' | 'Gold';
}

export interface FlaggedPriceWithSubmitter extends ProductPrice {
  submitter_trust_score: number | null;
  submitter_trust_level: 'Bronze' | 'Silver' | 'Gold' | null;
  product_name: string;
  product_brand: string;
}

// Admin - Pending Products
export const getPendingProducts = async (): Promise<{
  results: PendingProductWithSubmitter[];
  count: number;
}> => {
  const response = await api.get('/products/products/admin_pending/');
  return response.data;
};

export const approveProduct = async (productId: number): Promise<{ message: string; product: Product }> => {
  const response = await api.post(`/products/products/${productId}/approve/`);
  return response.data;
};

export const rejectProduct = async (productId: number): Promise<{ message: string; product: Product }> => {
  const response = await api.post(`/products/products/${productId}/reject/`);
  return response.data;
};

// Admin - Flagged Prices
export const getFlaggedPrices = async (): Promise<{
  results: FlaggedPriceWithSubmitter[];
  count: number;
}> => {
  const response = await api.get('/products/prices/admin_flagged/');
  return response.data;
};

export const approvePrice = async (priceId: number): Promise<{ message: string; price: ProductPrice }> => {
  const response = await api.post(`/products/prices/${priceId}/approve/`);
  return response.data;
};

export const rejectPrice = async (priceId: number): Promise<{ message: string; price: ProductPrice }> => {
  const response = await api.post(`/products/prices/${priceId}/reject/`);
  return response.data;
};
