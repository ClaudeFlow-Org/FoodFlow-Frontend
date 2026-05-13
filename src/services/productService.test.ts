import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { productService } from './productService';

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

describe('productService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Prueba unitaria: normaliza productos de inventario recibidos (FE-UT-016)
  it('maps backend products and applies the default low stock threshold', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 5,
            name: 'Tomate',
            description: 'Tomate fresco',
            category: 'Vegetales',
            supplier: 'Mercado Central',
            stockLevel: 20,
            unitOfMeasure: 'kg',
            unitCost: 3.5,
            createdAt: '2026-05-08T09:00:00',
          },
        ],
      },
    });

    const products = await productService.getAll();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/products');
    expect(products).toEqual([
      {
        id: 5,
        name: 'Tomate',
        description: 'Tomate fresco',
        category: 'Vegetales',
        supplier: 'Mercado Central',
        stockLevel: 20,
        unitOfMeasure: 'kg',
        unitCost: 3.5,
        lowStockThreshold: 10,
        createdAt: '2026-05-08T09:00:00',
        updatedAt: '2026-05-08T09:00:00',
      },
    ]);
  });
  // fin prueba

  // Prueba unitaria: crea producto enviando la categoria en la misma solicitud (FE-UT-017)
  it('posts the create-product payload with category in the same request', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 6,
          name: 'Harina',
          category: 'Panaderia',
          stockLevel: 12,
          unitOfMeasure: 'kg',
          unitCost: 2,
          lowStockThreshold: 4,
          createdAt: '2026-05-08T10:00:00',
        },
      },
    });

    const product = await productService.create({
      name: 'Harina',
      category: 'Panaderia',
      stockLevel: 12,
      unitOfMeasure: 'kg',
      unitCost: 2,
      lowStockThreshold: 4,
    });

    const requestBody = mockedApi.post.mock.calls[0][1] as Record<string, unknown>;
    expect(mockedApi.post).toHaveBeenCalledWith('/api/products', expect.any(Object));
    expect(requestBody).toMatchObject({
      name: 'Harina',
      category: 'Panaderia',
      stockLevel: 12,
      unitOfMeasure: 'kg',
      unitCost: 2,
      lowStockThreshold: 4,
    });
    expect(product).toMatchObject({
      id: 6,
      name: 'Harina',
      category: 'Panaderia',
      lowStockThreshold: 4,
    });
  });
  // fin prueba

  // Prueba unitaria: actualiza producto enviando categoria en la misma solicitud (FE-UT-018)
  it('puts the update-product payload with category in the same request', async () => {
    mockedApi.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 6,
          name: 'Harina integral',
          category: 'Granos',
          stockLevel: 8,
          unitOfMeasure: 'kg',
          unitCost: 2.4,
          lowStockThreshold: 3,
          createdAt: '2026-05-08T10:00:00',
        },
      },
    });

    const product = await productService.update(6, {
      name: 'Harina integral',
      category: 'Granos',
      stockLevel: 8,
      unitOfMeasure: 'kg',
      unitCost: 2.4,
      lowStockThreshold: 3,
    });

    const requestBody = mockedApi.put.mock.calls[0][1] as Record<string, unknown>;
    expect(mockedApi.put).toHaveBeenCalledWith('/api/products/6', expect.any(Object));
    expect(requestBody).toMatchObject({
      name: 'Harina integral',
      category: 'Granos',
      stockLevel: 8,
      unitOfMeasure: 'kg',
      unitCost: 2.4,
      lowStockThreshold: 3,
    });
    expect(product).toMatchObject({
      id: 6,
      name: 'Harina integral',
      category: 'Granos',
    });
  });
  // fin prueba
});
