import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createLocalizedError, parseValidationIssues } from '@/utils/errorMessages';

interface ApiErrorBody {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
  details?: unknown;
}

// Extend axios config to support retry
interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: number;
}

const MAX_RETRIES = 3;
const BASE_TIMEOUT = 10000;

const apiURL = import.meta.env.VITE_API_URL || 'https://foodflow-backend-y3lj.onrender.com';
console.log('🔧 API URL:', apiURL);

const getResponseMessage = (body: ApiErrorBody | undefined) => {
  if (typeof body?.message === 'string') {
    return body.message;
  }

  if (typeof body?.error === 'string') {
    return body.error;
  }

  return undefined;
};

const getValidationIssues = (body: ApiErrorBody | undefined) => [
  ...parseValidationIssues(body?.errors),
  ...parseValidationIssues(body?.details),
];

const createValidationError = (
  body: ApiErrorBody | undefined,
  status?: number
) => {
  const responseMessage = getResponseMessage(body);
  const issues = getValidationIssues(body);

  if (issues.length > 0) {
    return createLocalizedError('common.errors.validationWithDetails', {
      issues,
      status,
    });
  }

  if (responseMessage) {
    return createLocalizedError('common.errors.validationWithDetails', {
      issues: [{ message: responseMessage }],
      status,
    });
  }

  return createLocalizedError('common.errors.validation', {
    status,
    fallbackMessage: responseMessage,
  });
};

const getConflictTranslationKey = (message: string | undefined) => {
  if (/email|correo/i.test(message || '')) {
    return 'common.errors.duplicateEmail';
  }

  if (/(subscription|plan).*(limit|l[ií]mite|exceed|super)/i.test(message || '')) {
    return 'common.errors.limitExceeded';
  }

  return 'common.errors.conflict';
};

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
  () => Promise.reject(createLocalizedError('common.errors.requestSetup'))
);

// Response interceptor - handle errors with retry logic and better messages
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetryableAxiosRequestConfig;
    const requestUrl = error.config?.url || '';
    const responseBody = error.response?.data;
    const responseMessage = getResponseMessage(responseBody);
    const isLoginRequest = requestUrl.includes('/api/auth/login');
    const isPasswordRequest = requestUrl.includes('/api/users/password');

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (isLoginRequest) {
        return Promise.reject(createLocalizedError('common.errors.invalidCredentials', { status: 401 }));
      }

      if (isPasswordRequest) {
        return Promise.reject(createLocalizedError('settings.currentPasswordInvalid', { status: 401 }));
      }

      localStorage.removeItem('token');
      // Clear auth store state
      window.location.href = '/login';
      return Promise.reject(createLocalizedError('common.errors.sessionExpired', { status: 401 }));
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      if (/(subscription|plan|quota|limit|l[ií]mite|exceed|super)/i.test(responseMessage || '')) {
        return Promise.reject(createLocalizedError('common.errors.limitExceeded', { status: 403 }));
      }

      return Promise.reject(createLocalizedError('common.errors.forbidden', { status: 403 }));
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(createLocalizedError('common.errors.notFound', { status: 404 }));
    }

    // Handle 409 Conflict (e.g., duplicate email)
    if (error.response?.status === 409) {
      return Promise.reject(
        createLocalizedError(getConflictTranslationKey(responseMessage), {
          status: 409,
          fallbackMessage: responseMessage,
        })
      );
    }

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 422) {
      if (isLoginRequest) {
        return Promise.reject(createLocalizedError('common.errors.invalidCredentials', { status: error.response.status }));
      }

      if (isPasswordRequest && /current password|contrase[nñ]a actual|incorrect|invalid|wrong/i.test(responseMessage || '')) {
        return Promise.reject(createLocalizedError('settings.currentPasswordInvalid', { status: error.response.status }));
      }

      return Promise.reject(createValidationError(responseBody, error.response.status));
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      return Promise.reject(createLocalizedError('common.errors.rateLimit', { status: 429 }));
    }

    // Handle 500 Server Error - retry with exponential backoff
    if (error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503) {
      const retryCount = config?._retry || 0;

      if (config && retryCount < MAX_RETRIES) {
        config._retry = retryCount + 1;
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }

      return Promise.reject(createLocalizedError('common.errors.server', { status: error.response.status }));
    }

    // Handle network errors and timeout - retry with exponential backoff
    if (!error.response && config) {
      const retryCount = config._retry || 0;

      // Check if offline
      if (!navigator.onLine) {
        return Promise.reject(createLocalizedError('common.errors.offline'));
      }

      // Handle timeout
      if (error.code === 'ECONNABORTED') {
        if (retryCount < MAX_RETRIES) {
          config._retry = retryCount + 1;
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return api(config);
        }
        return Promise.reject(createLocalizedError('common.errors.timeout'));
      }

      // Handle other network errors
      if (retryCount < MAX_RETRIES) {
        config._retry = retryCount + 1;
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }

      return Promise.reject(createLocalizedError('common.errors.network'));
    }

    // Default error handling
    const validationIssues = getValidationIssues(responseBody);
    if (validationIssues.length > 0) {
      return Promise.reject(createValidationError(responseBody, error.response?.status));
    }

    return Promise.reject(
      createLocalizedError('common.errors.unexpected', {
        status: error.response?.status,
        fallbackMessage: responseMessage || error.message,
      })
    );
  }
);

export default api;
