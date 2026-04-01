import { useState, useEffect } from 'react';
import { subscriptionService } from '@/services';
import type { SubscriptionPlan, UserSubscription, SubscribeRequest } from '@/types';

export function useSubscription() {
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getPlans();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getCurrentSubscription();
      setCurrentSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (request: SubscribeRequest) => {
    try {
      setError(null);
      const data = await subscriptionService.subscribe(request);
      setCurrentSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      setError(null);
      await subscriptionService.cancelSubscription();
      await loadCurrentSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    }
  };

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
  }, []);

  return {
    currentSubscription,
    plans,
    loading,
    error,
    loadPlans,
    loadCurrentSubscription,
    subscribe,
    cancelSubscription,
  };
}
