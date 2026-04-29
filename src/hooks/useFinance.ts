import { useState, useEffect } from 'react';
import { financeService } from '@/services';
import type { DashboardMetrics, FinancialReport, ReportPeriod } from '@/types';
import { useI18n } from '@/i18n';

export function useFinance() {
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t('dashboard.loadError'));
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
      setError(err instanceof Error ? err.message : t('finance.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
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
