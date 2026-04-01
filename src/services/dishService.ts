import api from './api';
import type {
  ApiResponse,
  Dish,
  CreateDishRequest,
  UpdateDishRequest,
} from '@/types';

class DishService {
  private readonly basePath = '/api/dishes';

  async getAll(): Promise<Dish[]> {
    const response = await api.get<ApiResponse<Dish[]>>(this.basePath);
    return response.data.data;
  }

  async getById(id: number): Promise<Dish> {
    const response = await api.get<ApiResponse<Dish>>(`${this.basePath}/${id}`);
    return response.data.data;
  }

  async create(data: CreateDishRequest): Promise<Dish> {
    const response = await api.post<ApiResponse<Dish>>(this.basePath, data);
    return response.data.data;
  }

  async update(id: number, data: UpdateDishRequest): Promise<Dish> {
    const response = await api.put<ApiResponse<Dish>>(`${this.basePath}/${id}`, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export const dishService = new DishService();
