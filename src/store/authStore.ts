import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '@/types';
import { toErrorMessage, type ErrorMessage } from '@/utils/errorMessages';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ErrorMessage | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        localStorage.removeItem('token');
        try {
          const { authService } = await import('@/services/authService');
          const response = await authService.login(credentials);

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store token in localStorage for axios interceptor
          localStorage.setItem('token', response.token);
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: toErrorMessage(error, 'auth.login.failed'),
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        localStorage.removeItem('token');
        try {
          const { authService } = await import('@/services/authService');
          await authService.register(data);

          // Auto-login after registration since backend doesn't return token
          const loginResponse = await authService.login({
            email: data.email,
            password: data.password,
          });

          set({
            user: loginResponse.user,
            token: loginResponse.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store token in localStorage for axios interceptor
          localStorage.setItem('token', loginResponse.token);
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: toErrorMessage(error, 'auth.register.failed'),
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateProfile: async (data: UpdateProfileRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { authService } = await import('@/services/authService');
          const updatedUser = await authService.updateProfile(data);

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({ isLoading: false, error: toErrorMessage(error, 'settings.profileUpdateError') });
          throw error;
        }
      },

      refreshUserProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const { authService } = await import('@/services/authService');
          const updatedUser = await authService.getProfile();

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({ isLoading: false, error: toErrorMessage(error, 'settings.profileUpdateError') });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User | null) => set({ user }),

      setToken: (token: string | null) => {
        set({ token, isAuthenticated: !!token });
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
      },
    }),
    {
      name: 'foodflow-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
