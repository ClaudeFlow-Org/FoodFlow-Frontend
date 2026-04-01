import { useState, useEffect } from 'react';
import { financeService } from '@/services';
import type { DashboardMetrics, FinancialReport, ReportPeriod } from '@/types';

export function useFinance() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('WEEKLY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (reportPeriod: ReportPeriod) => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeService.getReport(reportPeriod);
      setReport(data);
      setPeriod(reportPeriod);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return {
    metrics,
    report,
    period,
    loading,
    error,
    loadDashboard,
    loadReport,
    setPeriod,
  };
}
