import api from './api';
import type {
  ApiResponse,
  Order,
  CreateOrderRequest,
} from '@/types';

class OrderService {
  private readonly basePath = '/api/orders';

  async getAll(): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[]>>(this.basePath);
    return response.data.data;
  }

  async getById(id: number): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`${this.basePath}/${id}`);
    return response.data.data;
  }

  async create(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(this.basePath, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export const orderService = new OrderService();
