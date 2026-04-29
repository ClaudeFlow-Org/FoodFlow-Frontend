import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  Skeleton,
  Button,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AttachMoney, ShoppingCart, Restaurant } from '@mui/icons-material';
import { MetricCard, DataTable, EmptyState } from '@/components/common';
import { financeService, orderService } from '@/services';
import type { DashboardMetrics, Column, Order } from '@/types';
import { useI18n } from '@/i18n';

const buildMetricsFromOrders = (orders: Order[]): DashboardMetrics => {
  const dishTotals = new Map<
    number,
    { dishId: number; dishName: string; totalRevenue: number; quantitySold: number }
  >();

  orders.forEach((order) => {
    order.lineItems.forEach((item) => {
      const current = dishTotals.get(item.dishId) || {
        dishId: item.dishId,
        dishName: item.dishName,
        totalRevenue: 0,
        quantitySold: 0,
      };
      current.totalRevenue += item.subtotal;
      current.quantitySold += item.quantity;
      dishTotals.set(item.dishId, current);
    });
  });

  const totalIncome = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return {
    totalIncome,
    totalExpenses: 0,
    profit: totalIncome,
    period: 'CURRENT',
    topDishes: Array.from(dishTotals.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    ),
    orderCount: orders.length,
  };
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsResult, ordersResult] = await Promise.allSettled([
        financeService.getDashboardMetrics(),
        orderService.getAll(),
      ]);

      const ordersData = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
      setRecentOrders(ordersData.slice(0, 5));

      if (metricsResult.status === 'fulfilled') {
        const fallbackMetrics = buildMetricsFromOrders(ordersData);
        setMetrics({
          ...metricsResult.value,
          orderCount: ordersData.length,
          topDishes:
            metricsResult.value.topDishes.length > 0
              ? metricsResult.value.topDishes
              : fallbackMetrics.topDishes,
        });
      } else if (ordersResult.status === 'fulfilled') {
        setMetrics(buildMetricsFromOrders(ordersData));
      } else {
        throw ordersResult.reason;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  const orderColumns: Column<Order>[] = [
    {
      id: 'orderNumber',
      label: t('orders.orderNumber'),
      render: (row: Order) => `#${row.orderNumber.slice(-6)}`,
    },
    {
      id: 'customer',
      label: t('orders.table'),
      render: (row: Order) => row.customerName || t('orders.walkIn'),
    },
    {
      id: 'total',
      label: t('orders.total'),
      render: (row: Order) => formatCurrency(row.totalAmount),
    },
    {
      id: 'status',
      label: t('orders.status'),
      render: (row: Order) => t(`orders.status.${row.status}`),
    },
  ];

  if (loading) {
    return (
      <Box>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={200} />
        </Stack>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.subtitle')}
        </Typography>
      </Box>

      {metrics && (
        <>
          {/* Metrics Cards */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <MetricCard
              title={t('dashboard.totalIncome')}
              value={formatCurrency(metrics.totalIncome)}
              color="warning"
            />
            <MetricCard
              title={t('dashboard.totalExpenses')}
              value={formatCurrency(metrics.totalExpenses)}
              color="error"
            />
            <MetricCard
              title={t('dashboard.profit')}
              value={formatCurrency(metrics.profit)}
              color={metrics.profit >= 0 ? 'info' : 'error'}
            />
            <MetricCard title={t('dashboard.totalOrders')} value={metrics.orderCount} color="warning" />
          </Stack>

          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.quickActions')}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Restaurant />}
                  onClick={() => void navigate('/dishes')}
                >
                  {t('dashboard.addDish')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShoppingCart />}
                  onClick={() => void navigate('/orders')}
                >
                  {t('dashboard.newOrder')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  onClick={() => void navigate('/finance')}
                >
                  {t('dashboard.viewReports')}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          {/* Two Column Layout */}
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
            {/* Top Dishes */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.topDishes')}
              </Typography>
              {metrics.topDishes?.length > 0 ? (
                <Card>
                  <CardContent sx={{ p: 0 }}>
                    {metrics.topDishes.slice(0, 5).map((dish, i) => (
                      <Box
                        key={dish.dishId}
                        sx={{
                          p: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: i < metrics.topDishes.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {dish.dishName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('dashboard.sold', { count: dish.quantitySold })}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                          {formatCurrency(dish.totalRevenue)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <EmptyState
                      title={t('dashboard.noDishDataTitle')}
                      description={t('dashboard.noDishDataDescription')}
                    />
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Recent Orders */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.recentOrders')}
              </Typography>
              {recentOrders.length > 0 ? (
                <DataTable
                  columns={orderColumns}
                  rows={recentOrders}
                  rowId={(row) => row.id}
                  emptyMessage={t('dashboard.noRecentOrders')}
                />
              ) : (
                <Card>
                  <CardContent>
                    <EmptyState
                      title={t('dashboard.noOrdersTitle')}
                      description={t('dashboard.noOrdersDescription')}
                      action={
                        <Button
                          variant="contained"
                          startIcon={<ShoppingCart />}
                          onClick={() => void navigate('/orders')}
                        >
                          {t('dashboard.createOrder')}
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}
