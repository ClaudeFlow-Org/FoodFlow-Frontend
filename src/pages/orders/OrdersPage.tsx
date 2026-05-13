import { useMemo, useState, useEffect } from 'react';
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
import { Add, Delete, Remove, AddCircle, CheckCircle, Cancel } from '@mui/icons-material';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader, ConfirmDialog, DataTable, EmptyState, SnackbarNotice } from '@/components/common';
import { orderService, dishService } from '@/services';
import type { Order, Dish, OrderType, OrderStatus, Column } from '@/types';
import { Receipt } from '@mui/icons-material';
import { useI18n } from '@/i18n';
import { createOrderSchema } from '@/validation/schemas';
import { useRevalidateOnLanguageChange } from '@/hooks';

const orderTypes: OrderType[] = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'];

const statusColors: Record<OrderStatus, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  PENDIENTE: 'default',
  ENTREGADA: 'success',
  CANCELADA: 'error',
};

// Helper to get first dish ID or 0 if no dishes
const getInitialDishId = (dishes: Dish[]) => (dishes.length > 0 ? dishes[0].id : 0);

export default function OrdersPage() {
  const { t, language } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const orderSchema = useMemo(() => createOrderSchema(t), [t]);
  type OrderFormData = z.infer<ReturnType<typeof createOrderSchema>>;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      tableIdentifier: '',
      lineItems: [],
    },
  });

  useRevalidateOnLanguageChange(trigger, language);

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'lineItems',
  });

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (openModal && fields.length === 0) {
      addLineItem();
    }
  }, [openModal, fields.length]);

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
    reset({
      tableIdentifier: '',
      lineItems: [],
    });
    setOpenModal(true);
    setSubmitError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    replace([]);
  };

  const addLineItem = () => {
    const initialDishId = getInitialDishId(dishes);
    const initialDish = dishes.find((d) => d.id === initialDishId);
    append({
      dishId: initialDishId,
      unitPrice: initialDish?.price || 0,
      quantity: 1,
    });
  };

  const updateLineItemDish = (index: number, dishId: number) => {
    const dish = dishes.find((d) => d.id === dishId);
    if (dish) {
      setValue(`lineItems.${index}.dishId`, dish.id, { shouldValidate: true });
      setValue(`lineItems.${index}.unitPrice`, dish.price, { shouldValidate: true });
    }
  };

  const getTotal = () => {
    return fields.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await orderService.create({
        tableIdentifier: data.tableIdentifier,
        lineItems: data.lineItems.map((item) => ({
          dishId: item.dishId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      });

      setSuccessMessage(t('notifications.orders.created'));
      handleCloseModal();
      void loadData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('orders.createError'));
    }
  });

  const handleDelete = async () => {
    if (deleteConfirm.order) {
      try {
        await orderService.delete(deleteConfirm.order.id);
        setDeleteConfirm({ open: false, order: null });
        setSuccessMessage(t('notifications.orders.deleted'));
        void loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('orders.deleteError'));
      }
    }
  };

  const handleAdvanceStatus = async (order: Order) => {
    try {
      await orderService.advanceStatus(order.id);
      setSuccessMessage(t('notifications.orders.statusUpdated'));
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.loadError'));
    }
  };

  const handleCancelStatus = async (order: Order) => {
    try {
      await orderService.cancelStatus(order.id);
      setSuccessMessage(t('notifications.orders.statusUpdated'));
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.loadError'));
    }
  };

  const columns: Column<Order>[] = [
    {
      id: 'orderNumber',
      label: t('orders.orderNumber'),
      render: (row: Order) => (
        <Box sx={{ fontWeight: 'bold' }}>#{row.orderNumber}</Box>
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
        <Stack direction="row" spacing={0.5}>
          {row.status === 'PENDIENTE' && (
            <IconButton
              size="small"
              color="primary"
              onClick={() => void handleAdvanceStatus(row)}
              title={t('orders.markDelivered')}
            >
              <CheckCircle fontSize="small" />
            </IconButton>
          )}
          {row.status === 'PENDIENTE' && (
            <IconButton
              size="small"
              color="warning"
              onClick={() => void handleCancelStatus(row)}
              title={t('orders.status.CANCELADA')}
            >
              <Cancel fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteConfirm({ open: true, order: row })}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
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
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <Stack direction="row" spacing={2}>
              <TextField
                label={t('orders.tableIdentifier')}
                fullWidth
                {...register('tableIdentifier')}
                error={!!errors.tableIdentifier}
                helperText={errors.tableIdentifier?.message}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('orders.lineItems')}
              </Typography>
              {fields.map((item, index) => (
                <Paper key={item.id} sx={{ p: { xs: 2, sm: 2.25 }, mb: 2 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <FormControl sx={{ flexGrow: 1, minWidth: { md: 280 } }}>
                      <InputLabel>{t('orders.dish')}</InputLabel>
                      <Select
                        value={item.dishId || ''}
                        label={t('orders.dish')}
                        onChange={(e) => updateLineItemDish(index, Number(e.target.value))}
                        error={!!errors.lineItems?.[index]?.dishId}
                      >
                        {dishes.map((dish) => (
                          <MenuItem key={dish.id} value={dish.id}>
                            {dish.name} - ${dish.price.toFixed(2)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.lineItems?.[index]?.dishId && (
                        <Typography variant="caption" color="error">
                          {errors.lineItems[index]?.dishId?.message}
                        </Typography>
                      )}
                    </FormControl>
                    <TextField
                      label={t('orders.quantity')}
                      type="number"
                      {...register(`lineItems.${index}.quantity` as const, { valueAsNumber: true })}
                      error={!!errors.lineItems?.[index]?.quantity}
                      helperText={errors.lineItems?.[index]?.quantity?.message}
                      InputProps={{
                        inputProps: { min: 1, max: 9999 },
                      }}
                      sx={{ width: { xs: '100%', md: 110 } }}
                    />
                    <Typography variant="body2" sx={{ minWidth: { md: 88 }, fontWeight: 700 }}>
                      ${Number(item.unitPrice || 0).toFixed(2)}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1 && index === 0}
                    >
                      <Remove />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
              {errors.lineItems?.message && (
                <Typography variant="caption" color="error">
                  {errors.lineItems.message}
                </Typography>
              )}
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
            onClick={() => void onSubmit()}
            variant="contained"
            disabled={fields.length === 0 || isSubmitting}
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
          number: deleteConfirm.order?.orderNumber || '',
        })}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteConfirm({ open: false, order: null })}
      />

      <SnackbarNotice
        open={Boolean(successMessage)}
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
    </Box>
  );
}
