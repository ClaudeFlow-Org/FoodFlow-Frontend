import { useState, useEffect } from 'react';
import { subscriptionService } from '@/services';
import type { SubscriptionPlan, UserSubscription, SubscribeRequest } from '@/types';
import { useI18n } from '@/i18n';
import { getLocalizedErrorMessage, toErrorMessage, type ErrorMessage } from '@/utils/errorMessages';

export function useSubscription() {
  const { t } = useI18n();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getPlans();
      setPlans(data);
    } catch (err) {
      setError(toErrorMessage(err, 'settings.loadSubscriptionError'));
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
      setError(toErrorMessage(err, 'settings.loadSubscriptionError'));
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
      setError(toErrorMessage(err, 'settings.subscriptionUpdateError'));
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      setError(null);
      await subscriptionService.cancelSubscription();
      await loadCurrentSubscription();
    } catch (err) {
      setError(toErrorMessage(err, 'settings.subscriptionUpdateError'));
      throw err;
    }
  };

  useEffect(() => {
    void loadPlans();
    void loadCurrentSubscription();
  }, []);

  return {
    currentSubscription,
    plans,
    loading,
    error: error ? getLocalizedErrorMessage(error, t, 'settings.loadSubscriptionError') : null,
    loadPlans,
    loadCurrentSubscription,
    subscribe,
    cancelSubscription,
  };
}
