import api from './api';
import type {
  ApiResponse,
  Product,
  ProductCategory,
  CreateProductRequest,
  UpdateProductRequest,
} from '@/types';

interface BackendProduct {
  id: number;
  name: string;
  description?: string;
  category?: string;
  supplier?: string;
  lowStockThreshold?: number;
  stockLevel: number;
  unitOfMeasure: string;
  unitCost: number;
  createdAt: string;
}

const mapProduct = (product: BackendProduct): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  category: product.category,
  supplier: product.supplier,
  stockLevel: product.stockLevel,
  unitOfMeasure: product.unitOfMeasure,
  unitCost: product.unitCost,
  lowStockThreshold: product.lowStockThreshold ?? 10,
  createdAt: product.createdAt,
  updatedAt: product.createdAt,
});

const toProductRequest = (data: CreateProductRequest | UpdateProductRequest, includeCategory = true) => ({
  name: data.name,
  description: data.description,
  category: includeCategory ? data.category : undefined,
  supplier: data.supplier,
  stockLevel: data.stockLevel,
  unitOfMeasure: data.unitOfMeasure,
  unitCost: data.unitCost,
  lowStockThreshold: data.lowStockThreshold,
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
      toProductRequest(data, false)
    );
    return mapProduct(response.data.data);
  }

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<ApiResponse<BackendProduct>>(
      `${this.basePath}/${id}`,
      toProductRequest(data, false)
    );
    return mapProduct(response.data.data);
  }

  async updateProductCategory(id: number, name: string): Promise<Product> {
    const response = await api.put<ApiResponse<BackendProduct>>(
      `${this.basePath}/${id}/category`,
      { name }
    );
    return mapProduct(response.data.data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  async getCategories(): Promise<ProductCategory[]> {
    const response = await api.get<ApiResponse<ProductCategory[]>>(`${this.basePath}/categories`);
    return response.data.data;
  }

  async createCategory(name: string): Promise<ProductCategory> {
    const response = await api.post<ApiResponse<ProductCategory>>(`${this.basePath}/categories`, { name });
    return response.data.data;
  }

  async updateCategory(id: number, name: string): Promise<ProductCategory> {
    const response = await api.put<ApiResponse<ProductCategory>>(`${this.basePath}/categories/${id}`, { name });
    return response.data.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`${this.basePath}/categories/${id}`);
  }
}

export const productService = new ProductService();
