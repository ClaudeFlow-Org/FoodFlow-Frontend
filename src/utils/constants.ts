/**
 * Application constants
 */

export const APP_NAME = 'FoodFlow';

export const API_TIMEOUT = 10000; // 10 seconds

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
} as const;

export const SUBSCRIPTION_TYPES = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const ORDER_TYPES = {
  DINE_IN: 'DINE_IN',
  TAKEAWAY: 'TAKEAWAY',
  DELIVERY: 'DELIVERY',
} as const;

export const ORDER_STATUS = {
  PENDIENTE: 'PENDIENTE',
  ENTREGADA: 'ENTREGADA',
  CANCELADA: 'CANCELADA',
} as const;

export const REPORT_PERIODS = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DISHES: '/dishes',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  FINANCE: '/finance',
  SETTINGS: '/settings',
} as const;

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
} as const;

export const TOAST_DURATION = 3000; // milliseconds

export const DEBOUNCE_DELAY = 300; // milliseconds
