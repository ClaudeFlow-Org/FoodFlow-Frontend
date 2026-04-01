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

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];

interface ChartData {
  name: string;
  income: number;
  expenses: number;
  profit: number;
}

export default function FinancePage() {
  const [period, setPeriod] = useState<ReportPeriod>('WEEKLY');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
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
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const chartData: ChartData[] | undefined = report?.incomeByCategory.map((cat, i) => ({
    name: cat.category,
    income: cat.amount,
    expenses: report.expensesByCategory[i]?.amount || 0,
    profit: cat.amount - (report.expensesByCategory[i]?.amount || 0),
  }));

  const topDishesData = metrics?.topDishes.map((d) => ({
    name: d.dishName,
    revenue: d.totalRevenue,
    quantity: d.quantitySold,
  }));

  const expensePieData = report?.expensesByCategory.map((cat) => ({
    name: cat.category,
    value: cat.amount,
  }));

  if (loading) {
    return (
      <Box>
        <PageHeader title="Finance" subtitle="Financial reports and analytics" />
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
        <PageHeader title="Finance" subtitle="Financial reports and analytics" />
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!metrics || !report) {
    return (
      <Box>
        <PageHeader title="Finance" subtitle="Financial reports and analytics" />
        <EmptyState
          title="No financial data available"
          description="Start creating orders to see your financial reports"
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Finance"
        subtitle="Financial reports and analytics"
        action={
          <ButtonGroup variant="outlined" size="small">
            <Button
              onClick={() => setPeriod('DAILY')}
              variant={period === 'DAILY' ? 'contained' : 'outlined'}
            >
              Daily
            </Button>
            <Button
              onClick={() => setPeriod('WEEKLY')}
              variant={period === 'WEEKLY' ? 'contained' : 'outlined'}
            >
              Weekly
            </Button>
            <Button
              onClick={() => setPeriod('MONTHLY')}
              variant={period === 'MONTHLY' ? 'contained' : 'outlined'}
            >
              Monthly
            </Button>
          </ButtonGroup>
        }
      />

      {/* Metrics Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <MetricCard
          title="Total Income"
          value={formatCurrency(report.totalIncome)}
          color="success"
          trend={
            report.previousPeriodComparison
              ? { value: report.previousPeriodComparison.incomeChange, label: 'vs prev period' }
              : undefined
          }
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(report.totalExpenses)}
          color="error"
          trend={
            report.previousPeriodComparison
              ? { value: -report.previousPeriodComparison.expenseChange, label: 'vs prev period' }
              : undefined
          }
        />
        <MetricCard
          title="Profit"
          value={formatCurrency(report.profit)}
          color="info"
          trend={
            report.previousPeriodComparison
              ? { value: report.previousPeriodComparison.profitChange, label: 'vs prev period' }
              : undefined
          }
        />
        <MetricCard
          title="Orders"
          value={metrics.orderCount}
          subtitle="Total orders"
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
                Income vs Expenses by Category
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
                  <Bar dataKey="income" fill="#4caf50" name="Income" />
                  <Bar dataKey="expenses" fill="#f44336" name="Expenses" />
                  <Bar dataKey="profit" fill="#2196f3" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No data available
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
                  Top Dishes by Revenue
                </Box>
              </Box>
              {topDishesData && topDishesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topDishesData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                    <Bar dataKey="revenue" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No dish data available
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Expenses Breakdown Pie Chart */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 'bold', m: 0 }}>
                  Expenses Breakdown
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
                      fill="#8884d8"
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
                  No expense data available
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}
