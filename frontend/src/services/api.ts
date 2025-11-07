import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { APIErrorResponse } from '../types';

// Dynamically determine API URL based on environment and hostname
const getApiBaseUrl = (): string => {
  // Use environment variable if available (production)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log('🌐 API Base URL (from env):', envApiUrl);
    return envApiUrl;
  }

  // Fallback to dynamic hostname detection (development)
  const hostname = window.location.hostname;
  let apiUrl: string;

  // If accessing from network IP (e.g., 192.168.1.24), use that IP for API
  // If accessing from localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    apiUrl = 'http://localhost:8000/api';
  } else {
    // Use the same hostname but port 8000 for API
    apiUrl = `http://${hostname}:8000/api`;
  }

  // Log for debugging
  console.log('🌐 API Base URL (dynamic):', apiUrl);
  console.log('📍 Current hostname:', hostname);

  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

// Request interceptor - add auth token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<APIErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access, refresh } = response.data;

        // Save new tokens
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // Update failed queue
        processQueue(null, access);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to extract error messages from API responses
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIErrorResponse;

    // Check for detail field (common in DRF)
    if (apiError?.detail) {
      return typeof apiError.detail === 'string'
        ? apiError.detail
        : JSON.stringify(apiError.detail);
    }

    // Check for error field
    if (apiError?.error) {
      return apiError.error;
    }

    // Check for non_field_errors
    if (apiError?.non_field_errors) {
      return Array.isArray(apiError.non_field_errors)
        ? apiError.non_field_errors[0]
        : apiError.non_field_errors;
    }

    // Check for field-specific errors
    const firstErrorKey = Object.keys(apiError || {}).find(
      (key) => key !== 'detail' && key !== 'error'
    );
    if (firstErrorKey && apiError) {
      const fieldError = apiError[firstErrorKey];
      return Array.isArray(fieldError) ? fieldError[0] : fieldError;
    }

    // Fallback to status text
    return error.response?.statusText || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Helper function to extract field errors for forms
export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIErrorResponse;
    const fieldErrors: Record<string, string> = {};

    if (apiError) {
      Object.keys(apiError).forEach((key) => {
        if (key !== 'detail' && key !== 'error' && key !== 'non_field_errors') {
          const value = apiError[key];
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        }
      });
    }

    return fieldErrors;
  }

  return {};
};

export default api;
