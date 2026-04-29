import { useState, useEffect } from 'react';
import { orderService } from '@/services';
import type { Order, CreateOrderRequest } from '@/types';
import { useI18n } from '@/i18n';

export function useOrders() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAll();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (data: CreateOrderRequest) => {
    await orderService.create(data);
    void loadOrders();
  };

  const deleteOrder = async (id: number) => {
    await orderService.delete(id);
    void loadOrders();
  };

  const getRecentOrders = (count: number = 5) => {
    return orders.slice(0, count);
  };

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter((o) => o.status === status);
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    loadOrders,
    createOrder,
    deleteOrder,
    getRecentOrders,
    getOrdersByStatus,
  };
}
