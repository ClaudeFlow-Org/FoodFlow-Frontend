import api from './api';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  UpdateProfileRequest,
  UpdatePasswordRequest,
} from '@/types';

type BackendUser = Omit<User, 'subscriptionType'> & {
  subscriptionType?: User['subscriptionType'];
};

const mapUser = (user: BackendUser): User => ({
  ...user,
  subscriptionType: user.subscriptionType || 'FREE',
});

class AuthService {
  private readonly basePath = '/api/auth';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      `${this.basePath}/login`,
      credentials
    );
    return {
      ...response.data.data,
      type: response.data.data.type || 'Bearer',
      user: mapUser(response.data.data.user),
    };
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<ApiResponse<BackendUser>>(
      `${this.basePath}/register`,
      data
    );
    return mapUser(response.data.data);
  }

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<BackendUser>>('/api/users/profile');
    return mapUser(response.data.data);
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put<ApiResponse<BackendUser>>('/api/users/profile', data);
    return mapUser(response.data.data);
  }

  async updatePassword(data: UpdatePasswordRequest): Promise<void> {
    await api.put('/api/users/password', data);
  }
}

export const authService = new AuthService();
