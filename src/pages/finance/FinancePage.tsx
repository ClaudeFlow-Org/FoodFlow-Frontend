import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Stack,
  Alert,
  Skeleton,
  Chip,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PageHeader, MetricCard, EmptyState } from '@/components/common';
import { financeService } from '@/services';
import type { DashboardMetrics, FinancialReport, ReportPeriod } from '@/types';
import { useI18n } from '@/i18n';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b'];

interface ChartData {
  name: string;
  income: number;
  expenses: number;
  profit: number;
}

export default function FinancePage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<ReportPeriod>('WEEKLY');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, reportData] = await Promise.all([
        financeService.getDashboardMetrics(period),
        financeService.getReport(period),
      ]);
      setMetrics(metricsData);
      setReport(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('finance.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const chartData: ChartData[] | undefined = report
    ? [
        {
          name: t('finance.periodSummary'),
          income: report.totalIncome,
          expenses: report.totalExpenses,
          profit: report.profit,
        },
      ]
    : undefined;

  const topDishesData = (metrics?.topDishes?.length ? metrics.topDishes : report?.topDishes)?.map((d) => ({
    name: d.dishName,
    revenue: d.totalRevenue,
    quantity: d.quantitySold,
  }));

  const expensePieData = report?.expensesByCategory
    ?.filter((cat) => cat.amount > 0)
    .map((cat) => ({
      name: cat.category || t('common.unknown'),
      value: cat.amount,
    }));

  const expenseTotal = expensePieData?.reduce((total, item) => total + item.value, 0) || 0;

  if (loading) {
    return (
      <Box>
        <PageHeader title={t('finance.title')} subtitle={t('finance.subtitle')} />
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={300} />
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title={t('finance.title')} subtitle={t('finance.subtitle')} />
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!metrics || !report) {
    return (
      <Box>
        <PageHeader title={t('finance.title')} subtitle={t('finance.subtitle')} />
        <EmptyState
          title={t('finance.noDataTitle')}
          description={t('finance.noDataDescription')}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={t('finance.title')}
        subtitle={t('finance.subtitle')}
        action={
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: { sm: 'center' } }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {formatDate(report.startDate)} - {formatDate(report.endDate)}
              </Typography>
              <Chip label={`${report.orderCount} ${t('finance.orders')}`} size="small" color="warning" variant="outlined" />
            </Box>
            <ButtonGroup variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                onClick={() => setPeriod('DAILY')}
                variant={period === 'DAILY' ? 'contained' : 'outlined'}
                sx={{ flex: { xs: 1, sm: 'initial' } }}
              >
                {t('finance.daily')}
              </Button>
              <Button
                onClick={() => setPeriod('WEEKLY')}
                variant={period === 'WEEKLY' ? 'contained' : 'outlined'}
                sx={{ flex: { xs: 1, sm: 'initial' } }}
              >
                {t('finance.weekly')}
              </Button>
              <Button
                onClick={() => setPeriod('MONTHLY')}
                variant={period === 'MONTHLY' ? 'contained' : 'outlined'}
                sx={{ flex: { xs: 1, sm: 'initial' } }}
              >
                {t('finance.monthly')}
              </Button>
            </ButtonGroup>
          </Box>
        }
      />

      {/* Metrics Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ mb: 3.5 }}>
        <MetricCard
          title={t('finance.totalIncome')}
          value={formatCurrency(report.totalIncome)}
          color="warning"
          sx={{ flex: 1 }}
          trend={
            report.previousPeriodComparison
              ? { value: report.previousPeriodComparison.incomeChange, label: t('finance.vsPrevious') }
              : undefined
          }
        />
        <MetricCard
          title={t('finance.totalExpenses')}
          value={formatCurrency(report.totalExpenses)}
          color="error"
          sx={{ flex: 1 }}
          trend={
            report.previousPeriodComparison
              ? { value: -report.previousPeriodComparison.expenseChange, label: t('finance.vsPrevious') }
              : undefined
          }
        />
        <MetricCard
          title={t('finance.profit')}
          value={formatCurrency(report.profit)}
          color="info"
          sx={{ flex: 1 }}
          trend={
            report.previousPeriodComparison
              ? { value: report.previousPeriodComparison.profitChange, label: t('finance.vsPrevious') }
              : undefined
          }
        />
        <MetricCard
          title={t('finance.orders')}
          value={report.orderCount}
          subtitle={t('finance.totalOrders')}
          color="warning"
          sx={{ flex: 1 }}
        />
      </Stack>

      {/* Charts */}
      <Stack spacing={3}>
        {/* Income vs Expenses Bar Chart */}
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ mb: 2 }}>
              <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 800, m: 0 }}>
                {t('finance.incomeVsExpenses')}
              </Box>
            </Box>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                  <Legend />
                  <Bar dataKey="income" fill="#2563eb" name={t('finance.income')} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name={t('finance.expenses')} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" fill="#16a34a" name={t('finance.profit')} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('finance.noData')}
              </Box>
            )}
          </CardContent>
        </Card>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Top Dishes Chart */}
          <Card sx={{ flex: 1, minWidth: 0 }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 800, m: 0 }}>
                  {t('finance.topDishesRevenue')}
                </Box>
              </Box>
              {topDishesData && topDishesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topDishesData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t('finance.noDishData')}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Expenses Breakdown Pie Chart */}
          <Card sx={{ flex: 1, minWidth: 0 }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 800, m: 0 }}>
                  {t('finance.expensesBreakdown')}
                </Box>
              </Box>
              {expensePieData && expensePieData.length > 0 ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Box sx={{ width: { xs: '100%', sm: '52%' }, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expensePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={88}
                          innerRadius={42}
                          fill="#2563eb"
                          dataKey="value"
                        >
                          {expensePieData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Stack spacing={1.25} sx={{ width: { xs: '100%', sm: '48%' }, minWidth: 0 }}>
                    {expensePieData.map((item, index) => {
                      const percentage = expenseTotal > 0 ? (item.value / expenseTotal) * 100 : 0;
                      return (
                        <Box key={item.name}>
                          <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: COLORS[index % COLORS.length],
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="body2" noWrap>
                                {item.name}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {formatCurrency(item.value)}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 7,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: COLORS[index % COLORS.length],
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {percentage.toFixed(0)}%
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
              ) : (
                <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Alert severity="info" sx={{ maxWidth: 460 }}>
                    {t('finance.noExpenseDataHint')}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}
