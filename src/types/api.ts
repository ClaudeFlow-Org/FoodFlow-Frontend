// ==================== Common Types ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// ==================== Auth Types ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type?: string;
  user: User;
}

export interface User {
  id: number;
  name: string;
  email: string;
  subscriptionType: SubscriptionType;
  createdAt: string;
}

export type SubscriptionType = 'FREE' | 'STANDARD' | 'PREMIUM';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==================== Dish Types ====================

export interface Dish {
  id: number;
  name: string;
  description?: string;
  price: number;
  ingredients: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDishRequest {
  name: string;
  description?: string;
  price: number;
  ingredients: string;
}

export interface UpdateDishRequest {
  name?: string;
  description?: string;
  price?: number;
  ingredients?: string;
}

// ==================== Product Types ====================

export interface Product {
  id: number;
  name: string;
  description?: string;
  stockLevel: number;
  unitOfMeasure: string;
  unitCost: number;
  lowStockThreshold: number;
  category?: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  stockLevel: number;
  unitOfMeasure: string;
  unitCost: number;
  lowStockThreshold?: number;
  category?: string;
  supplier?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  stockLevel?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  lowStockThreshold?: number;
  category?: string;
  supplier?: string;
}

// ==================== Order Types ====================

export interface Order {
  id: number;
  orderNumber: string;
  customerName?: string;
  orderType: OrderType;
  status: OrderStatus;
  totalAmount: number;
  lineItems: LineItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface LineItem {
  id: number;
  dishId: number;
  dishName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateOrderRequest {
  tableIdentifier: string;
  lineItems: CreateLineItemRequest[];
}

export interface CreateLineItemRequest {
  dishId: number;
  dishName?: string;
  unitPrice: number;
  quantity: number;
}

// ==================== Finance Types ====================

export interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  period: string;
  topDishes: TopDish[];
  orderCount: number;
}

export interface TopDish {
  dishId: number;
  dishName: string;
  totalRevenue: number;
  quantitySold: number;
}

export interface FinancialReport {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  incomeByCategory: CategoryReport[];
  expensesByCategory: CategoryReport[];
  topDishes: TopDish[];
  previousPeriodComparison?: PeriodComparison;
}

export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface CategoryReport {
  category: string;
  amount: number;
  percentage: number;
}

export interface PeriodComparison {
  incomeChange: number;
  expenseChange: number;
  profitChange: number;
}

// ==================== Subscription Types ====================

export interface SubscriptionPlan {
  id: number;
  name: string;
  type: SubscriptionType;
  price: number;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
  maxDishes: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  hasAdvancedReports: boolean;
  hasInventoryManagement: boolean;
}

export interface UserSubscription {
  id: number | string;
  type: SubscriptionType;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  endDate?: string;
  plan: SubscriptionPlan;
}

export interface SubscribeRequest {
  plan: SubscriptionType;
}
