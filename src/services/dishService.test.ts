import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { dishService } from './dishService';

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

describe('dishService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Prueba unitaria: normaliza platos sin campos opcionales (FE-UT-018)
  it('maps backend dishes and defaults missing optional fields', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 11,
            name: 'Sopa del dia',
            createdAt: '2026-05-09T09:00:00',
          },
        ],
      },
    });

    const dishes = await dishService.getAll();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/dishes');
    expect(dishes).toEqual([
      {
        id: 11,
        name: 'Sopa del dia',
        description: undefined,
        price: 0,
        ingredients: '',
        recipeItems: [],
        availableOrders: null,
        userId: 0,
        createdAt: '2026-05-09T09:00:00',
        updatedAt: '2026-05-09T09:00:00',
      },
    ]);
  });
  // fin prueba

  // Prueba unitaria: envia payload de creacion de plato (FE-UT-019)
  it('posts create-dish data to the dishes endpoint', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 12,
          name: 'Tacu tacu',
          description: 'Con seco',
          price: 24,
          ingredients: 'frejol, arroz, culantro',
          createdAt: '2026-05-09T10:00:00',
        },
      },
    });

    const payload = {
      name: 'Tacu tacu',
      description: 'Con seco',
      price: 24,
      ingredients: 'frejol, arroz, culantro',
    };
    const dish = await dishService.create(payload);

    expect(mockedApi.post).toHaveBeenCalledWith('/api/dishes', payload);
    expect(dish).toMatchObject({
      id: 12,
      name: 'Tacu tacu',
      price: 24,
      ingredients: 'frejol, arroz, culantro',
    });
  });
  // fin prueba

  // Prueba unitaria: elimina plato por endpoint esperado (FE-UT-020)
  it('deletes a dish by id', async () => {
    mockedApi.delete.mockResolvedValueOnce({});

    await dishService.delete(12);

    expect(mockedApi.delete).toHaveBeenCalledWith('/api/dishes/12');
  });
  // fin prueba
});
