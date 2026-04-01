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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, ordersData] = await Promise.all([
        financeService.getDashboardMetrics(),
        orderService.getAll(),
      ]);
      setMetrics(metricsData);
      setRecentOrders(ordersData.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const orderColumns: Column<Order>[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      render: (row: Order) => `#${row.orderNumber.slice(-6)}`,
    },
    {
      id: 'customer',
      label: 'Customer',
      render: (row: Order) => row.customerName || 'Walk-in',
    },
    {
      id: 'total',
      label: 'Total',
      render: (row: Order) => formatCurrency(row.totalAmount),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row: Order) => row.status,
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
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's your restaurant overview.
        </Typography>
      </Box>

      {metrics && (
        <>
          {/* Metrics Cards */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <MetricCard
              title="Total Income"
              value={formatCurrency(metrics.totalIncome)}
              color="success"
            />
            <MetricCard
              title="Total Expenses"
              value={formatCurrency(metrics.totalExpenses)}
              color="error"
            />
            <MetricCard
              title="Profit"
              value={formatCurrency(metrics.profit)}
              color={metrics.profit >= 0 ? 'info' : 'error'}
            />
            <MetricCard title="Total Orders" value={metrics.orderCount} color="warning" />
          </Stack>

          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Restaurant />}
                  onClick={() => navigate('/dishes')}
                >
                  Add Dish
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShoppingCart />}
                  onClick={() => navigate('/orders')}
                >
                  New Order
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  onClick={() => navigate('/finance')}
                >
                  View Reports
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
                Top Dishes by Revenue
              </Typography>
              {metrics.topDishes.length > 0 ? (
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
                            {dish.quantitySold} sold
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
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
                      title="No dish data yet"
                      description="Start creating orders to see your top dishes"
                    />
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Recent Orders */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              {recentOrders.length > 0 ? (
                <DataTable
                  columns={orderColumns}
                  rows={recentOrders}
                  rowId={(row) => row.id}
                  emptyMessage="No recent orders"
                />
              ) : (
                <Card>
                  <CardContent>
                    <EmptyState
                      title="No orders yet"
                      description="Create your first order to get started"
                      action={
                        <Button
                          variant="contained"
                          startIcon={<ShoppingCart />}
                          onClick={() => navigate('/orders')}
                        >
                          Create Order
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
