import api from './api';
import type {
  ApiResponse,
  SubscriptionPlan,
  UserSubscription,
  SubscribeRequest,
} from '@/types';

interface BackendSubscriptionPlan {
  name: string;
  monthlyPrice: number;
  benefits: string[];
}

interface BackendSubscription {
  id: string;
  plan: string;
  status: UserSubscription['status'];
  startDate: string;
  endDate?: string;
}

const planOrder: Record<string, number> = {
  FREE: 1,
  STANDARD: 2,
  PREMIUM: 3,
};

const planLimits: Record<string, Pick<SubscriptionPlan, 'maxDishes' | 'maxProducts' | 'maxOrdersPerMonth' | 'hasAdvancedReports' | 'hasInventoryManagement'>> = {
  FREE: {
    maxDishes: 50,
    maxProducts: 100,
    maxOrdersPerMonth: 200,
    hasAdvancedReports: false,
    hasInventoryManagement: true,
  },
  STANDARD: {
    maxDishes: 200,
    maxProducts: 500,
    maxOrdersPerMonth: 1000,
    hasAdvancedReports: false,
    hasInventoryManagement: true,
  },
  PREMIUM: {
    maxDishes: Number.MAX_SAFE_INTEGER,
    maxProducts: Number.MAX_SAFE_INTEGER,
    maxOrdersPerMonth: Number.MAX_SAFE_INTEGER,
    hasAdvancedReports: true,
    hasInventoryManagement: true,
  },
};

const toSubscriptionType = (name: string): SubscriptionPlan['type'] => {
  const normalized = name.toUpperCase();
  if (normalized === 'STANDARD' || normalized === 'PREMIUM') {
    return normalized;
  }
  return 'FREE';
};

const mapPlan = (plan: BackendSubscriptionPlan): SubscriptionPlan => {
  const type = toSubscriptionType(plan.name);
  return {
    id: planOrder[type],
    name: plan.name,
    type,
    price: plan.monthlyPrice,
    currency: 'USD',
    interval: 'MONTHLY',
    features: plan.benefits,
    ...planLimits[type],
  };
};

class SubscriptionService {
  private readonly basePath = '/api/subscriptions';

  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get<ApiResponse<BackendSubscriptionPlan[]>>(`${this.basePath}/plans`);
    return response.data.data.map(mapPlan);
  }

  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const response = await api.get<ApiResponse<BackendSubscription>>(`${this.basePath}/current`);
      const type = toSubscriptionType(response.data.data.plan);
      return {
        id: response.data.data.id,
        type,
        status: response.data.data.status,
        startDate: response.data.data.startDate,
        endDate: response.data.data.endDate,
        plan: {
          id: planOrder[type],
          name: response.data.data.plan,
          type,
          price: 0,
          currency: 'USD',
          interval: 'MONTHLY',
          features: [],
          ...planLimits[type],
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('subscription not found')) {
        return null;
      }
      throw error;
    }
  }

  async subscribe(data: SubscribeRequest): Promise<UserSubscription> {
    const response = await api.post<ApiResponse<BackendSubscription>>(
      `${this.basePath}/subscribe`,
      data
    );
    const type = toSubscriptionType(response.data.data.plan);
    return {
      id: response.data.data.id,
      type,
      status: response.data.data.status,
      startDate: response.data.data.startDate,
      endDate: response.data.data.endDate,
      plan: {
        id: planOrder[type],
        name: response.data.data.plan,
        type,
        price: 0,
        currency: 'USD',
        interval: 'MONTHLY',
        features: [],
        ...planLimits[type],
      },
    };
  }

  async cancelSubscription(): Promise<void> {
    await api.post(`${this.basePath}/cancel`);
  }
}

export const subscriptionService = new SubscriptionService();
