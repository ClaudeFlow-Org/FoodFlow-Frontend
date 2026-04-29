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

const COLORS = ['#f2811d', '#c45c3e', '#2d2620', '#ff833a', '#8f4a32', '#6b5f52'];

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
        financeService.getDashboardMetrics(),
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

  const chartData: ChartData[] | undefined = report?.incomeByCategory?.map((cat, i) => ({
    name: cat.category === 'Income' ? t('finance.income') : cat.category,
    income: cat.amount,
    expenses: report.expensesByCategory?.[i]?.amount || 0,
    profit: cat.amount - (report.expensesByCategory?.[i]?.amount || 0),
  }));

  const topDishesData = metrics?.topDishes?.map((d) => ({
    name: d.dishName,
    revenue: d.totalRevenue,
    quantity: d.quantitySold,
  }));

  const expensePieData = report?.expensesByCategory?.map((cat) => ({
    name: cat.category,
    value: cat.amount,
  }));

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
          <ButtonGroup variant="outlined" size="small">
            <Button
              onClick={() => setPeriod('DAILY')}
              variant={period === 'DAILY' ? 'contained' : 'outlined'}
            >
              {t('finance.daily')}
            </Button>
            <Button
              onClick={() => setPeriod('WEEKLY')}
              variant={period === 'WEEKLY' ? 'contained' : 'outlined'}
            >
              {t('finance.weekly')}
            </Button>
            <Button
              onClick={() => setPeriod('MONTHLY')}
              variant={period === 'MONTHLY' ? 'contained' : 'outlined'}
            >
              {t('finance.monthly')}
            </Button>
          </ButtonGroup>
        }
      />

      {/* Metrics Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <MetricCard
          title={t('finance.totalIncome')}
          value={formatCurrency(report.totalIncome)}
          color="warning"
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
          trend={
            report.previousPeriodComparison
              ? { value: report.previousPeriodComparison.profitChange, label: t('finance.vsPrevious') }
              : undefined
          }
        />
        <MetricCard
          title={t('finance.orders')}
          value={metrics.orderCount}
          subtitle={t('finance.totalOrders')}
          color="warning"
        />
      </Stack>

      {/* Charts */}
      <Stack spacing={3}>
        {/* Income vs Expenses Bar Chart */}
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 'bold', m: 0 }}>
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
                  <Bar dataKey="income" fill="#f2811d" name={t('finance.income')} />
                  <Bar dataKey="expenses" fill="#c45c3e" name={t('finance.expenses')} />
                  <Bar dataKey="profit" fill="#2d2620" name={t('finance.profit')} />
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
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 'bold', m: 0 }}>
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
                    <Bar dataKey="revenue" fill="#f2811d" />
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
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 'bold', m: 0 }}>
                  {t('finance.expensesBreakdown')}
                </Box>
              </Box>
              {expensePieData && expensePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#f2811d"
                      dataKey="value"
                    >
                      {expensePieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t('finance.noExpenseData')}
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}
