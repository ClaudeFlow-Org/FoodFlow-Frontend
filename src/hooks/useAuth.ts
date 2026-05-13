import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/i18n';
import { getLocalizedErrorMessage } from '@/utils/errorMessages';

export function useAuth() {
  const { t } = useI18n();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error: error ? getLocalizedErrorMessage(error, t, 'common.errorOccurred') : null,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };
}
