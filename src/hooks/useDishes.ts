import { useState, useEffect } from 'react';
import { dishService } from '@/services';
import type { Dish, CreateDishRequest, UpdateDishRequest } from '@/types';
import { useI18n } from '@/i18n';

export function useDishes() {
  const { t } = useI18n();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dishService.getAll();
      setDishes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dishes.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const createDish = async (data: CreateDishRequest) => {
    await dishService.create(data);
    void loadDishes();
  };

  const updateDish = async (id: number, data: UpdateDishRequest) => {
    await dishService.update(id, data);
    void loadDishes();
  };

  const deleteDish = async (id: number) => {
    await dishService.delete(id);
    void loadDishes();
  };

  useEffect(() => {
    void loadDishes();
  }, []);

  return {
    dishes,
    loading,
    error,
    loadDishes,
    createDish,
    updateDish,
    deleteDish,
  };
}
