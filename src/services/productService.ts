import api from './api';
import type {
  ApiResponse,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from '@/types';

class ProductService {
  private readonly basePath = '/api/products';

  async getAll(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(this.basePath);
    return response.data.data;
  }

  async getById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`${this.basePath}/${id}`);
    return response.data.data;
  }

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>(this.basePath, data);
    return response.data.data;
  }

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`${this.basePath}/${id}`, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export const productService = new ProductService();
