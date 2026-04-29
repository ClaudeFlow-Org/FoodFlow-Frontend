import api from './api';
import type {
  ApiResponse,
  Order,
  CreateOrderRequest,
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
  tableIdentifier: string;
  orderDate: string;
  lineItems: BackendOrderLineItem[];
  totalAmount: number;
}

const mapOrder = (order: BackendOrder): Order => ({
  id: order.id,
  orderNumber: String(order.id),
  customerName: order.tableIdentifier,
  orderType: 'DINE_IN',
  status: 'PENDING',
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
    return response.data.data.map(mapOrder);
  }

  async getById(id: number): Promise<Order> {
    const response = await api.get<ApiResponse<BackendOrder>>(`${this.basePath}/${id}`);
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
    return mapOrder(response.data.data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export const orderService = new OrderService();
