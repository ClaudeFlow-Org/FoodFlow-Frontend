import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { financeService } from './financeService';
import { subscriptionService } from './subscriptionService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = api as unknown as {
  get: Mock;
  post: Mock;
};

describe('financeService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Prueba unitaria: mapea metricas del dashboard financiero (FE-UT-021)
  it('maps dashboard metrics from the backend shape', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          period: 'WEEKLY',
          totalIncome: 480,
          totalExpenses: 155,
          netProfit: 325,
          orderCount: 9,
          top5Dishes: [
            {
              dishId: 1,
              dishName: 'Arroz con pollo',
              totalRevenue: 180,
              quantitySold: 6,
            },
          ],
        },
      },
    });

    const metrics = await financeService.getDashboardMetrics('WEEKLY');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/finance/dashboard', {
      params: { period: 'WEEKLY' },
    });
    expect(metrics).toEqual({
      totalIncome: 480,
      totalExpenses: 155,
      profit: 325,
      period: 'WEEKLY',
      orderCount: 9,
      topDishes: [
        {
          dishId: 1,
          dishName: 'Arroz con pollo',
          totalRevenue: 180,
          quantitySold: 6,
        },
      ],
    });
  });
  // fin prueba

  // Prueba unitaria: mapea reporte financiero con gastos por categoria (FE-UT-022)
  it('maps financial reports including expense breakdown and comparisons', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          period: 'MONTHLY',
          startDate: '2026-05-01',
          endDate: '2026-06-01',
          metrics: {
            totalIncome: 900,
            totalExpenses: 350,
            netProfit: 550,
            incomeVariation: 12,
            expensesVariation: 4,
          },
          orderCount: 20,
          topDishes: [],
          expenseBreakdown: [
            {
              name: 'Vegetales',
              amount: 120,
              percentage: 34.28,
            },
          ],
        },
      },
    });

    const report = await financeService.getReport('MONTHLY');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/finance/reports', {
      params: { period: 'MONTHLY' },
    });
    expect(report).toMatchObject({
      period: 'MONTHLY',
      totalIncome: 900,
      totalExpenses: 350,
      profit: 550,
      orderCount: 20,
      expensesByCategory: [
        {
          category: 'Vegetales',
          amount: 120,
          percentage: 34.28,
        },
      ],
      previousPeriodComparison: {
        incomeChange: 12,
        expenseChange: 4,
        profitChange: 0,
      },
    });
  });
  // fin prueba
});

describe('subscriptionService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Prueba unitaria: ordena y completa limites de planes (FE-UT-023)
  it('maps subscription plans with frontend limits and pricing', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            name: 'Premium',
            monthlyPrice: 29,
            benefits: ['Reportes avanzados'],
          },
          {
            name: 'Free',
            monthlyPrice: 0,
            benefits: ['Panel basico'],
          },
        ],
      },
    });

    const plans = await subscriptionService.getPlans();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/subscriptions/plans');
    expect(plans).toEqual([
      expect.objectContaining({
        id: 3,
        type: 'PREMIUM',
        price: 29,
        hasAdvancedReports: true,
      }),
      expect.objectContaining({
        id: 1,
        type: 'FREE',
        price: 0,
        maxOrdersPerMonth: 200,
      }),
    ]);
  });
  // fin prueba

  // Prueba unitaria: devuelve null cuando no hay suscripcion activa (FE-UT-024)
  it('returns null when the current subscription does not exist', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Subscription not found'));

    const subscription = await subscriptionService.getCurrentSubscription();

    expect(subscription).toBeNull();
  });
  // fin prueba

  // Prueba unitaria: suscribe usuario a plan seleccionado (FE-UT-025)
  it('posts a subscription request and maps the resulting subscription', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'sub-123',
          plan: 'Standard',
          status: 'ACTIVE',
          startDate: '2026-05-09',
        },
      },
    });

    const subscription = await subscriptionService.subscribe({ plan: 'STANDARD' });

    expect(mockedApi.post).toHaveBeenCalledWith('/api/subscriptions/subscribe', {
      plan: 'STANDARD',
    });
    expect(subscription).toMatchObject({
      id: 'sub-123',
      type: 'STANDARD',
      status: 'ACTIVE',
      plan: {
        id: 2,
        type: 'STANDARD',
        maxProducts: 500,
      },
    });
  });
  // fin prueba
});
