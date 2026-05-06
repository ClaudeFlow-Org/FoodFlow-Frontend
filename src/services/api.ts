import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface ApiErrorBody {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
}

// Extend axios config to support retry
interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: number;
}

const MAX_RETRIES = 3;
const BASE_TIMEOUT = 10000;

const apiURL = import.meta.env.VITE_API_URL || 'https://foodflow-backend-y3lj.onrender.com';
console.log('🔧 API URL:', apiURL);

const api = axios.create({
  baseURL: apiURL,
  timeout: BASE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error instanceof Error ? error : new Error('Request setup failed'))
);

// Response interceptor - handle errors with retry logic and better messages
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetryableAxiosRequestConfig;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Clear auth store state
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }

    // Handle 409 Conflict (e.g., duplicate email)
    if (error.response?.status === 409) {
      const errorBody = error.response?.data;
      return Promise.reject(new Error(errorBody?.message || 'This resource already exists.'));
    }

    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      const errorBody = error.response?.data;
      const validationMessage = errorBody?.errors
        ?.map((item) => [item.field, item.message].filter(Boolean).join(': '))
        .filter(Boolean)
        .join(', ');
      const message = validationMessage || errorBody?.message || 'Validation failed. Please check your input.';
      return Promise.reject(new Error(message));
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait a moment and try again.'));
    }

    // Handle 500 Server Error - retry with exponential backoff
    if (error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503) {
      const retryCount = config?._retry || 0;

      if (retryCount < MAX_RETRIES) {
        config!._retry = retryCount + 1;
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config!);
      }

      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    // Handle network errors and timeout - retry with exponential backoff
    if (!error.response && config) {
      const retryCount = config._retry || 0;

      // Check if offline
      if (!navigator.onLine) {
        return Promise.reject(new Error('You are offline. Please check your internet connection.'));
      }

      // Handle timeout
      if (error.code === 'ECONNABORTED') {
        if (retryCount < MAX_RETRIES) {
          config._retry = retryCount + 1;
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return api(config);
        }
        return Promise.reject(new Error('Request timeout. The server took too long to respond.'));
      }

      // Handle other network errors
      if (retryCount < MAX_RETRIES) {
        config._retry = retryCount + 1;
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }

      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }

    // Default error handling
    const errorBody = error.response?.data;
    const validationMessage = errorBody?.errors
      ?.map((item) => [item.field, item.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join(', ');
    const message =
      validationMessage ||
      errorBody?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);

export default api;
