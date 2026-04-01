import api from './api';
import type {
  ApiResponse,
  SubscriptionPlan,
  UserSubscription,
  SubscribeRequest,
} from '@/types';

class SubscriptionService {
  private readonly basePath = '/api/subscriptions';

  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get<ApiResponse<SubscriptionPlan[]>>(`${this.basePath}/plans`);
    return response.data.data;
  }

  async getCurrentSubscription(): Promise<UserSubscription> {
    const response = await api.get<ApiResponse<UserSubscription>>(`${this.basePath}/current`);
    return response.data.data;
  }

  async subscribe(data: SubscribeRequest): Promise<UserSubscription> {
    const response = await api.post<ApiResponse<UserSubscription>>(`${this.basePath}/subscribe`, data);
    return response.data.data;
  }

  async cancelSubscription(): Promise<void> {
    await api.post(`${this.basePath}/cancel`);
  }
}

export const subscriptionService = new SubscriptionService();
