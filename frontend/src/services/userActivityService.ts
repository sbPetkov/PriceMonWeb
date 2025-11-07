import api from './api';
import type {
  ScanHistory,
  ScanHistoryCreateRequest,
  PriceVerification,
  PriceReport,
  PriceReportCreateRequest,
  PaginatedResponse,
} from '../types';

// Scan History
export const getScanHistory = async (): Promise<PaginatedResponse<ScanHistory>> => {
  const response = await api.get('/products/scan-history/');
  return response.data;
};

export const recordScan = async (data: ScanHistoryCreateRequest): Promise<ScanHistory> => {
  const response = await api.post('/products/scan-history/', data);
  return response.data;
};

// Price Verification
export const getMyVerifications = async (): Promise<PaginatedResponse<PriceVerification>> => {
  const response = await api.get('/products/verifications/');
  return response.data;
};

export const verifyPrice = async (
  priceId: number,
  voteType: 'positive' | 'negative'
): Promise<{
  message: string;
  verification: PriceVerification;
  positive_votes: number;
  negative_votes: number;
}> => {
  const response = await api.post(`/products/verifications/verify/${priceId}/`, {
    vote_type: voteType,
  });
  return response.data;
};

export const checkUserVotes = async (priceIds: number[]): Promise<{ votes: Record<number, 'positive' | 'negative'> }> => {
  const response = await api.post('/products/verifications/check-votes/', {
    price_ids: priceIds,
  });
  return response.data;
};

// Price Reporting
export const getMyReports = async (): Promise<PaginatedResponse<PriceReport>> => {
  const response = await api.get('/products/reports/');
  return response.data;
};

export const reportPrice = async (
  priceId: number,
  data: PriceReportCreateRequest
): Promise<{ message: string; report: PriceReport }> => {
  const response = await api.post(`/products/reports/report/${priceId}/`, data);
  return response.data;
};
