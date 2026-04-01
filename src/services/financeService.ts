import api from './api';
import type {
  ApiResponse,
  DashboardMetrics,
  FinancialReport,
  ReportPeriod,
} from '@/types';

class FinanceService {
  private readonly basePath = '/api/finance';

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await api.get<ApiResponse<DashboardMetrics>>(`${this.basePath}/dashboard`);
    return response.data.data;
  }

  async getReport(period: ReportPeriod): Promise<FinancialReport> {
    const response = await api.get<ApiResponse<FinancialReport>>(`${this.basePath}/reports`, {
      params: { period },
    });
    return response.data.data;
  }
}

export const financeService = new FinanceService();
