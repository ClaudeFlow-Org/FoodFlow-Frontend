import { useState, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { getLocalizedErrorMessage, toErrorMessage, type ErrorMessage } from '@/utils/errorMessages';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useApi<T>(apiCall: () => Promise<T>): UseApiResult<T> {
  const { t } = useI18n();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(toErrorMessage(err, 'common.errorOccurred'));
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error: error ? getLocalizedErrorMessage(error, t, 'common.errorOccurred') : null,
    execute,
    reset,
  };
}
