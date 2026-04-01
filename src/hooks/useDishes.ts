import { useState, useEffect } from 'react';
import { dishService } from '@/services';
import type { Dish, CreateDishRequest, UpdateDishRequest } from '@/types';

export function useDishes() {
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
      setError(err instanceof Error ? err.message : 'Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  const createDish = async (data: CreateDishRequest) => {
    await dishService.create(data);
    loadDishes();
  };

  const updateDish = async (id: number, data: UpdateDishRequest) => {
    await dishService.update(id, data);
    loadDishes();
  };

  const deleteDish = async (id: number) => {
    await dishService.delete(id);
    loadDishes();
  };

  useEffect(() => {
    loadDishes();
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
