import api from './api';
import type {
  ApiResponse,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from '@/types';

interface BackendProduct {
  id: number;
  name: string;
  stockLevel: number;
  unitOfMeasure: string;
  unitCost: number;
  createdAt: string;
}

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const mapProduct = (product: BackendProduct): Product => ({
  id: product.id,
  name: product.name,
  stockLevel: product.stockLevel,
  unitOfMeasure: product.unitOfMeasure,
  unitCost: product.unitCost,
  lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
  createdAt: product.createdAt,
  updatedAt: product.createdAt,
});

const toProductRequest = (data: CreateProductRequest | UpdateProductRequest) => ({
  name: data.name,
  stockLevel: data.stockLevel,
  unitOfMeasure: data.unitOfMeasure,
  unitCost: data.unitCost,
});

class ProductService {
  private readonly basePath = '/api/products';

  async getAll(): Promise<Product[]> {
    const response = await api.get<ApiResponse<BackendProduct[]>>(this.basePath);
    return response.data.data.map(mapProduct);
  }

  async getById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<BackendProduct>>(`${this.basePath}/${id}`);
    return mapProduct(response.data.data);
  }

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<ApiResponse<BackendProduct>>(
      this.basePath,
      toProductRequest(data)
    );
    return mapProduct(response.data.data);
  }

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<ApiResponse<BackendProduct>>(
      `${this.basePath}/${id}`,
      toProductRequest(data)
    );
    return mapProduct(response.data.data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export const productService = new ProductService();
