import { useState, useEffect } from 'react';
import { productService } from '@/services';
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateProductRequest) => {
    await productService.create(data);
    loadProducts();
  };

  const updateProduct = async (id: number, data: UpdateProductRequest) => {
    await productService.update(id, data);
    loadProducts();
  };

  const deleteProduct = async (id: number) => {
    await productService.delete(id);
    loadProducts();
  };

  const getLowStockProducts = () => {
    return products.filter((p) => p.stockLevel <= p.lowStockThreshold);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
  };
}
