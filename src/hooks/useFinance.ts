import { useState, useEffect } from 'react';
import { financeService } from '@/services';
import type { DashboardMetrics, FinancialReport, ReportPeriod } from '@/types';
import { useI18n } from '@/i18n';
import { getLocalizedErrorMessage, toErrorMessage, type ErrorMessage } from '@/utils/errorMessages';

export function useFinance() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('WEEKLY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeService.getDashboardMetrics(period);
      setMetrics(data);
    } catch (err) {
      setError(toErrorMessage(err, 'dashboard.loadError'));
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
      setMetrics(await financeService.getDashboardMetrics(reportPeriod));
    } catch (err) {
      setError(toErrorMessage(err, 'finance.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [period]);

  return {
    metrics,
    report,
    period,
    loading,
    error: error ? getLocalizedErrorMessage(error, t, 'finance.loadError') : null,
    loadDashboard,
    loadReport,
    setPeriod,
  };
}
