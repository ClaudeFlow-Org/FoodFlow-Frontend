import api from './api';
import type {
  ApiResponse,
  Order,
  CreateOrderRequest,
  OrderStatus,
} from '@/types';

interface BackendOrderLineItem {
  dishId: number;
  dishName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface BackendOrder {
  id: number;
  orderNumber: string;
  tableIdentifier: string;
  orderDate: string;
  lineItems: BackendOrderLineItem[];
  totalAmount: number;
  status: string;
}

const normalizeOrderStatus = (status?: string): OrderStatus => {
  switch ((status || '').toUpperCase()) {
    case 'ENTREGADA':
    case 'DELIVERED':
      return 'ENTREGADA';
    case 'CANCELADA':
    case 'CANCELLED':
      return 'CANCELADA';
    case 'PENDIENTE':
    case 'PENDING':
    case 'PREPARING':
    case 'READY':
    default:
      return 'PENDIENTE';
  }
};

const mapOrder = (order: BackendOrder): Order => ({
  id: order.id,
  orderNumber: order.orderNumber || String(order.id),
  customerName: order.tableIdentifier,
  orderType: 'DINE_IN',
  status: normalizeOrderStatus(order.status),
  totalAmount: order.totalAmount,
  lineItems: order.lineItems.map((item, index) => ({
    id: index,
    dishId: item.dishId,
    dishName: item.dishName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.lineTotal,
  })),
  createdAt: order.orderDate,
  updatedAt: order.orderDate,
});

class OrderService {
  private readonly basePath = '/api/orders';

  async getAll(): Promise<Order[]> {
    const response = await api.get<ApiResponse<BackendOrder[]>>(this.basePath);
    const items = response.data?.data;
    return Array.isArray(items) ? items.map(mapOrder) : [];
  }

  async getById(id: number): Promise<Order> {
    const response = await api.get<ApiResponse<BackendOrder>>(`${this.basePath}/${id}`);
    if (!response.data?.data) {
      throw new Error('Order not found');
    }
    return mapOrder(response.data.data);
  }

  async create(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post<ApiResponse<BackendOrder>>(this.basePath, {
      tableIdentifier: data.tableIdentifier,
      lineItems: data.lineItems.map((item) => ({
        dishId: item.dishId,
        dishName: item.dishName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    });
    if (!response.data?.data) {
      throw new Error('Failed to create order');
    }
    return mapOrder(response.data.data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  async advanceStatus(id: number): Promise<Order> {
    const response = await api.put<ApiResponse<BackendOrder>>(`${this.basePath}/${id}/advance`);
    if (!response.data?.data) {
      throw new Error('Order not found');
    }
    return mapOrder(response.data.data);
  }

  async cancelStatus(id: number): Promise<Order> {
    const response = await api.put<ApiResponse<BackendOrder>>(`${this.basePath}/${id}/cancel`);
    if (!response.data?.data) {
      throw new Error('Order not found');
    }
    return mapOrder(response.data.data);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const response = await api.put<ApiResponse<BackendOrder>>(`${this.basePath}/${id}/status?status=${status}`);
    if (!response.data?.data) {
      throw new Error('Order not found');
    }
    return mapOrder(response.data.data);
  }
}

export const orderService = new OrderService();
