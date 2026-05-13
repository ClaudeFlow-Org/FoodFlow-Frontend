import api from './api';
import type {
  ApiResponse,
  Dish,
  CreateDishRequest,
  UpdateDishRequest,
} from '@/types';

interface BackendDish {
  id: number;
  name: string;
  description?: string;
  price?: number;
  ingredients?: string;
  createdAt: string;
}

const mapDish = (dish: BackendDish): Dish => ({
  id: dish.id,
  name: dish.name,
  description: dish.description,
  price: dish.price ?? 0,
  ingredients: dish.ingredients || '',
  userId: 0,
  createdAt: dish.createdAt,
  updatedAt: dish.createdAt,
});

class DishService {
  private readonly basePath = '/api/dishes';

  async getAll(): Promise<Dish[]> {
    const response = await api.get<ApiResponse<BackendDish[]>>(this.basePath);
    const items = response.data?.data;
    return Array.isArray(items) ? items.map(mapDish) : [];
  }

  async getById(id: number): Promise<Dish> {
    const response = await api.get<ApiResponse<BackendDish>>(`${this.basePath}/${id}`);
    if (!response.data?.data) {
      throw new Error('Dish not found');
    }
    return mapDish(response.data.data);
  }

  async create(data: CreateDishRequest): Promise<Dish> {
    const response = await api.post<ApiResponse<BackendDish>>(this.basePath, data);
    if (!response.data?.data) {
      throw new Error('Failed to create dish');
    }
    return mapDish(response.data.data);
  }

  async update(id: number, data: UpdateDishRequest): Promise<Dish> {
    const response = await api.put<ApiResponse<BackendDish>>(`${this.basePath}/${id}`, data);
    if (!response.data?.data) {
      throw new Error('Dish not found');
    }
    return mapDish(response.data.data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export const dishService = new DishService();
