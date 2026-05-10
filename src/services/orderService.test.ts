import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { orderService } from './orderService';

vi.mock('./api', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = api as unknown as {
  delete: Mock;
  get: Mock;
  post: Mock;
  put: Mock;
};

describe('orderService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Prueba unitaria: normaliza ordenes recibidas del backend (FE-UT-013)
  it('maps backend orders into frontend order models', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 7,
            orderNumber: '42-001',
            tableIdentifier: 'Mesa 4',
            orderDate: '2026-05-08T12:00:00',
            totalAmount: 35,
            status: 'DELIVERED',
            lineItems: [
              {
                dishId: 3,
                dishName: 'Menu ejecutivo',
                quantity: 2,
                unitPrice: 12.5,
                lineTotal: 25,
              },
            ],
          },
        ],
      },
    });

    const orders = await orderService.getAll();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/orders');
    expect(orders).toEqual([
      {
        id: 7,
        orderNumber: '42-001',
        customerName: 'Mesa 4',
        orderType: 'DINE_IN',
        status: 'ENTREGADA',
        totalAmount: 35,
        lineItems: [
          {
            id: 0,
            dishId: 3,
            dishName: 'Menu ejecutivo',
            quantity: 2,
            unitPrice: 12.5,
            subtotal: 25,
          },
        ],
        createdAt: '2026-05-08T12:00:00',
        updatedAt: '2026-05-08T12:00:00',
      },
    ]);
  });
  // fin prueba

  // Prueba unitaria: envia payload de creacion compatible con API (FE-UT-014)
  it('posts the backend create-order payload and maps the response', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 8,
          orderNumber: '42-002',
          tableIdentifier: 'Barra',
          orderDate: '2026-05-08T13:00:00',
          totalAmount: 16,
          status: 'PENDING',
          lineItems: [
            {
              dishId: 4,
              dishName: 'Cafe',
              quantity: 2,
              unitPrice: 8,
              lineTotal: 16,
            },
          ],
        },
      },
    });

    const order = await orderService.create({
      tableIdentifier: 'Barra',
      lineItems: [
        {
          dishId: 4,
          dishName: 'Cafe',
          quantity: 2,
          unitPrice: 8,
        },
      ],
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/api/orders', {
      tableIdentifier: 'Barra',
      lineItems: [
        {
          dishId: 4,
          dishName: 'Cafe',
          quantity: 2,
          unitPrice: 8,
        },
      ],
    });
    expect(order.status).toBe('PENDIENTE');
    expect(order.totalAmount).toBe(16);
  });
  // fin prueba

  // Prueba unitaria: actualiza estado de orden via endpoint esperado (FE-UT-015)
  it('calls the status endpoint when updating an order status', async () => {
    mockedApi.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 8,
          orderNumber: '42-002',
          tableIdentifier: 'Barra',
          orderDate: '2026-05-08T13:00:00',
          totalAmount: 16,
          status: 'CANCELLED',
          lineItems: [],
        },
      },
    });

    const order = await orderService.updateStatus(8, 'CANCELADA');

    expect(mockedApi.put).toHaveBeenCalledWith('/api/orders/8/status?status=CANCELADA');
    expect(order.status).toBe('CANCELADA');
  });
  // fin prueba
});
