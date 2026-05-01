import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Typography,
} from '@mui/material';
import { Add, Delete, Remove, AddCircle } from '@mui/icons-material';
import { PageHeader, ConfirmDialog, DataTable, EmptyState } from '@/components/common';
import { orderService, dishService } from '@/services';
import type { Order, Dish, CreateLineItemRequest, OrderType, OrderStatus, Column } from '@/types';
import { Receipt } from '@mui/icons-material';
import { useI18n } from '@/i18n';

const orderTypes: OrderType[] = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'];

const statusColors: Record<OrderStatus, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  PENDING: 'default',
  PREPARING: 'info',
  READY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

interface LineItemForm extends CreateLineItemRequest {
  dishName: string;
  unitPrice: number;
}

// Helper to get first dish ID or 0 if no dishes
const getInitialDishId = (dishes: Dish[]) => dishes.length > 0 ? dishes[0].id : 0;

export default function OrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  });
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tableIdentifier: '',
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, dishesData] = await Promise.all([
        orderService.getAll(),
        dishService.getAll(),
      ]);
      setOrders(ordersData);
      setDishes(dishesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      tableIdentifier: '',
    });
    setLineItems([]);
    setOpenModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setLineItems([]);
  };

  const addLineItem = () => {
    const initialDishId = getInitialDishId(dishes);
    const initialDish = dishes.find(d => d.id === initialDishId);
    setLineItems([...lineItems, {
      dishId: initialDishId,
      quantity: 1,
      dishName: initialDish?.name || '',
      unitPrice: initialDish?.price || 0
    }]);
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'dishId') {
      const dish = dishes.find((d) => d.id === value);
      if (dish) {
        updated[index] = {
          ...updated[index],
          dishId: dish.id,
          dishName: dish.name,
          unitPrice: dish.price,
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const handleSubmit = async () => {
    try {
      if (lineItems.length === 0) {
        setError(t('orders.emptyLineItems'));
        return;
      }

      await orderService.create({
        tableIdentifier: formData.tableIdentifier,
        lineItems: lineItems.map(({ dishId, dishName, unitPrice, quantity }) => ({
          dishId,
          dishName,
          unitPrice,
          quantity,
        })),
      });

      handleCloseModal();
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.createError'));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.order) {
      try {
        await orderService.delete(deleteConfirm.order.id);
        setDeleteConfirm({ open: false, order: null });
        void loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('orders.deleteError'));
      }
    }
  };

  const columns: Column<Order>[] = [
    {
      id: 'orderNumber',
      label: t('orders.orderNumber'),
      render: (row: Order) => (
        <Box sx={{ fontWeight: 'bold' }}>#{row.orderNumber.slice(-6)}</Box>
      ),
    },
    {
      id: 'customer',
      label: t('orders.table'),
      render: (row: Order) => row.customerName || t('orders.walkIn'),
    },
    {
      id: 'type',
      label: t('orders.type'),
      render: (row: Order) => (
        <Chip
          label={orderTypes.includes(row.orderType) ? t(`orders.type.${row.orderType}`) : row.orderType}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'items',
      label: t('orders.items'),
      render: (row: Order) => t('orders.itemsCount', { count: row.lineItems.length }),
    },
    {
      id: 'total',
      label: t('orders.total'),
      render: (row: Order) => (
        <Typography variant="body2" fontWeight="bold">
          ${row.totalAmount.toFixed(2)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: t('orders.status'),
      render: (row: Order) => (
        <Chip label={t(`orders.status.${row.status}`)} color={statusColors[row.status]} size="small" />
      ),
    },
    {
      id: 'actions',
      label: t('common.actions'),
      render: (row: Order) => (
        <IconButton
          size="small"
          color="error"
          onClick={() => setDeleteConfirm({ open: true, order: row })}
        >
          <Delete fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (loading) {
    return <Box>{t('common.loading')}</Box>;
  }

  return (
    <Box>
      <PageHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenModal}
          >
            {t('orders.new')}
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      {orders.length === 0 ? (
        <EmptyState
          icon={<Receipt fontSize="large" />}
          title={t('orders.emptyTitle')}
          description={t('orders.emptyDescription')}
          action={
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenModal}>
              {t('orders.new')}
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={orders}
          rowId={(row) => row.id}
        />
      )}

      {/* Create Order Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{t('orders.createTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction="row" spacing={2}>
              <TextField
                label={t('orders.tableIdentifier')}
                fullWidth
                value={formData.tableIdentifier}
                onChange={(e) => setFormData({ ...formData, tableIdentifier: e.target.value })}
                required
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('orders.lineItems')}
              </Typography>
              {lineItems.map((item, index) => (
                <Paper key={index} sx={{ p: { xs: 2, sm: 2.25 }, mb: 2 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <FormControl sx={{ flexGrow: 1, minWidth: { md: 280 } }}>
                      <InputLabel>{t('orders.dish')}</InputLabel>
                      <Select
                        value={item.dishId}
                        label={t('orders.dish')}
                        onChange={(e) => updateLineItem(index, 'dishId', e.target.value)}
                      >
                        {dishes.map((dish) => (
                          <MenuItem key={dish.id} value={dish.id}>
                            {dish.name} - ${dish.price.toFixed(2)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label={t('orders.quantity')}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      InputProps={{
                        inputProps: { min: 1 },
                      }}
                      sx={{ width: { xs: '100%', md: 110 } }}
                    />
                    <Typography variant="body2" sx={{ minWidth: { md: 88 }, fontWeight: 700 }}>
                      ${item.unitPrice.toFixed(2)}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1 && index === 0}
                    >
                      <Remove />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
              <Button
                startIcon={<AddCircle />}
                onClick={addLineItem}
                disabled={dishes.length === 0}
              >
                {t('orders.addItem')}
              </Button>
            </Box>

            <Paper sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: 'background.default' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="h6">{t('orders.total')}</Typography>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 850, whiteSpace: 'nowrap' }}>
                  ${getTotal().toFixed(2)}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleCloseModal}>{t('common.cancel')}</Button>
          <Button
            onClick={() => void handleSubmit()}
            variant="contained"
            disabled={lineItems.length === 0 || !formData.tableIdentifier}
          >
            {t('orders.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title={t('orders.deleteTitle')}
        message={t('orders.deleteMessage', {
          number: deleteConfirm.order?.orderNumber.slice(-6) || '',
        })}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteConfirm({ open: false, order: null })}
      />
    </Box>
  );
}
