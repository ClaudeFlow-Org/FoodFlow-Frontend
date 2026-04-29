import { useState, useEffect } from 'react';
import { productService } from '@/services';
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/types';
import { useI18n } from '@/i18n';

export function useProducts() {
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t('products.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateProductRequest) => {
    await productService.create(data);
    void loadProducts();
  };

  const updateProduct = async (id: number, data: UpdateProductRequest) => {
    await productService.update(id, data);
    void loadProducts();
  };

  const deleteProduct = async (id: number) => {
    await productService.delete(id);
    void loadProducts();
  };

  const getLowStockProducts = () => {
    return products.filter((p) => p.stockLevel <= p.lowStockThreshold);
  };

  useEffect(() => {
    void loadProducts();
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
