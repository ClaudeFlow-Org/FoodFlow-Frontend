import { useState, useEffect } from 'react';
import { orderService } from '@/services';
import type { Order, CreateOrderRequest } from '@/types';
import { useI18n } from '@/i18n';
import { getLocalizedErrorMessage, toErrorMessage, type ErrorMessage } from '@/utils/errorMessages';

export function useOrders() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAll();
      setOrders(data);
    } catch (err) {
      setError(toErrorMessage(err, 'orders.loadError'));
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
    error: error ? getLocalizedErrorMessage(error, t, 'orders.loadError') : null,
    loadOrders,
    createOrder,
    deleteOrder,
    getRecentOrders,
    getOrdersByStatus,
  };
}
