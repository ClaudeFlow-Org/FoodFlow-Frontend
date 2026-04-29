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
    return response.data.data.map(mapDish);
  }

  async getById(id: number): Promise<Dish> {
    const response = await api.get<ApiResponse<BackendDish>>(`${this.basePath}/${id}`);
    return mapDish(response.data.data);
  }

  async create(data: CreateDishRequest): Promise<Dish> {
    const response = await api.post<ApiResponse<BackendDish>>(this.basePath, data);
    return mapDish(response.data.data);
  }

  async update(id: number, data: UpdateDishRequest): Promise<Dish> {
    const response = await api.put<ApiResponse<BackendDish>>(`${this.basePath}/${id}`, data);
    return mapDish(response.data.data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export const dishService = new DishService();
