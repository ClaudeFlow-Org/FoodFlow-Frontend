import api from './api';
import type {
  ApiResponse,
  DashboardMetrics,
  FinancialReport,
  ReportPeriod,
} from '@/types';

interface BackendTopDish {
  dishId: number;
  dishName: string;
  totalRevenue: number;
  quantitySold: number;
}

interface BackendDashboard {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeVariation?: number;
  expensesVariation?: number;
  top5Dishes?: BackendTopDish[];
}

interface BackendExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
}

interface BackendFinancialReport {
  period: string;
  startDate: string;
  endDate: string;
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    incomeVariation?: number;
    expensesVariation?: number;
  };
  topDishes?: BackendTopDish[];
  expenseBreakdown?: BackendExpenseCategory[];
}

const mapDashboardMetrics = (metrics: BackendDashboard): DashboardMetrics => ({
  totalIncome: metrics.totalIncome,
  totalExpenses: metrics.totalExpenses,
  profit: metrics.netProfit,
  period: 'CURRENT',
  topDishes: metrics.top5Dishes || [],
  orderCount: 0,
});

const mapFinancialReport = (report: BackendFinancialReport): FinancialReport => ({
  period: report.period as ReportPeriod,
  startDate: report.startDate,
  endDate: report.endDate,
  totalIncome: report.metrics.totalIncome,
  totalExpenses: report.metrics.totalExpenses,
  profit: report.metrics.netProfit,
  incomeByCategory:
    report.metrics.totalIncome > 0
      ? [{ category: 'Income', amount: report.metrics.totalIncome, percentage: 100 }]
      : [],
  expensesByCategory: (report.expenseBreakdown || []).map((expense) => ({
    category: expense.name,
    amount: expense.amount,
    percentage: expense.percentage,
  })),
  topDishes: report.topDishes || [],
  previousPeriodComparison: {
    incomeChange: report.metrics.incomeVariation || 0,
    expenseChange: report.metrics.expensesVariation || 0,
    profitChange: 0,
  },
});

class FinanceService {
  private readonly basePath = '/api/finance';

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await api.get<ApiResponse<BackendDashboard>>(`${this.basePath}/dashboard`);
    return mapDashboardMetrics(response.data.data);
  }

  async getReport(period: ReportPeriod): Promise<FinancialReport> {
    const response = await api.get<ApiResponse<BackendFinancialReport>>(`${this.basePath}/reports`, {
      params: { period },
    });
    return mapFinancialReport(response.data.data);
  }
}

export const financeService = new FinanceService();
