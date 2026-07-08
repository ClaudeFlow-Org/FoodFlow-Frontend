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
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Remove from '@mui/icons-material/Remove';
import AddCircle from '@mui/icons-material/AddCircle';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import Receipt from '@mui/icons-material/Receipt';
import { PageHeader, ConfirmDialog, DataTable, EmptyState } from '@/components/common';
import { orderService, dishService } from '@/services';
import type { Order, Dish, CreateLineItemRequest, OrderType, OrderStatus, Column } from '@/types';
import { useI18n } from '@/i18n';
import { formatCurrency } from '@/utils';
import {
  getLocalizedErrorMessage,
  toErrorMessage,
  translatedError,
  type ErrorMessage,
} from '@/utils/errorMessages';

const orderTypes: OrderType[] = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'];
const MAX_TABLE_IDENTIFIER_LENGTH = 50;
const MAX_ORDER_LINE_ITEMS = 30;
const MAX_ORDER_ITEM_QUANTITY = 100;
const MAX_ORDER_TOTAL = 9_999_999_999.99;

const statusColors: Record<OrderStatus, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  PENDIENTE: 'default',
  ENTREGADA: 'success',
  CANCELADA: 'error',
};

interface LineItemForm extends CreateLineItemRequest {
  dishName: string;
  unitPrice: number;
}

const hasRecipeAvailability = (dish: Dish) =>
  dish.recipeItems.length > 0 && dish.availableOrders !== null && dish.availableOrders !== undefined;

const isDishUnavailable = (dish: Dish) =>
  hasRecipeAvailability(dish) && (dish.availableOrders ?? 0) <= 0;

const getInitialDishId = (dishes: Dish[]) =>
  dishes.find((dish) => !isDishUnavailable(dish))?.id ?? 0;

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
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const [formData, setFormData] = useState({
    tableIdentifier: '',
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  const errorMessage = error ? getLocalizedErrorMessage(error, t, 'orders.loadError') : null;
  const hasAvailableDishes = dishes.some((dish) => !isDishUnavailable(dish));

  const getDishById = (dishId: number) => dishes.find((dish) => dish.id === dishId);

  const normalizeOrderQuantity = (value: string | number) => {
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return 1;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), MAX_ORDER_ITEM_QUANTITY);
  };

  const validateOrderForm = (): ErrorMessage | null => {
    if (!formData.tableIdentifier.trim()) {
      return translatedError('orders.tableIdentifierRequired');
    }

    if (formData.tableIdentifier.trim().length > MAX_TABLE_IDENTIFIER_LENGTH) {
      return translatedError('orders.tableIdentifierMax', { max: MAX_TABLE_IDENTIFIER_LENGTH });
    }

    if (lineItems.length === 0) {
      return translatedError('orders.emptyLineItems');
    }

    if (lineItems.length > MAX_ORDER_LINE_ITEMS) {
      return translatedError('orders.maxLineItems', { max: MAX_ORDER_LINE_ITEMS });
    }

    const total = getTotal();
    if (!Number.isFinite(total) || total > MAX_ORDER_TOTAL) {
      return translatedError('orders.totalMax', { max: formatCurrency(MAX_ORDER_TOTAL) });
    }

    return null;
  };

  const validateLineItemAvailability = (): ErrorMessage | null => {
    const quantitiesByDish = new Map<number, number>();
    for (const item of lineItems) {
      if (!Number.isFinite(item.quantity) || item.quantity < 1) {
        return translatedError('orders.invalidQuantity');
      }
      if (item.quantity > MAX_ORDER_ITEM_QUANTITY) {
        return translatedError('orders.quantityMax', { max: MAX_ORDER_ITEM_QUANTITY });
      }
      quantitiesByDish.set(item.dishId, (quantitiesByDish.get(item.dishId) || 0) + item.quantity);
    }

    for (const [dishId, quantity] of quantitiesByDish.entries()) {
      const dish = getDishById(dishId);
      if (!dish) {
        return translatedError('orders.dishNotFound');
      }

      if (isDishUnavailable(dish)) {
        return translatedError('orders.unavailableDishSelected', { dish: dish.name });
      }

      if (hasRecipeAvailability(dish) && quantity > (dish.availableOrders ?? 0)) {
        return translatedError('orders.insufficientDishAvailability', {
          dish: dish.name,
          available: dish.availableOrders ?? 0,
        });
      }
    }

    return null;
  };

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
      setError(toErrorMessage(err, 'orders.loadError'));
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

  const isOrderFormDirty = () => {
    return formData.tableIdentifier.trim() !== '' || lineItems.length > 0;
  };

  const closeModal = () => {
    setOpenModal(false);
    setLineItems([]);
    setFormData({
      tableIdentifier: '',
    });
    setError(null);
  };

  const handleCloseModal = () => {
    if (isOrderFormDirty()) {
      setDiscardConfirmOpen(true);
      return;
    }

    closeModal();
  };

  const handleDiscardOrderChanges = () => {
    setDiscardConfirmOpen(false);
    closeModal();
  };

  const addLineItem = () => {
    if (lineItems.length >= MAX_ORDER_LINE_ITEMS) {
      setError(translatedError('orders.maxLineItems', { max: MAX_ORDER_LINE_ITEMS }));
      return;
    }

    const initialDishId = getInitialDishId(dishes);
    if (!initialDishId) {
      setError(translatedError('orders.noAvailableDishes'));
      return;
    }

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
      const selectedDishId = Number(value);
      const dish = dishes.find((d) => d.id === selectedDishId);
      if (dish) {
        updated[index] = {
          ...updated[index],
          dishId: dish.id,
          dishName: dish.name,
          unitPrice: dish.price,
        };
      }
    } else if (field === 'quantity') {
      updated[index] = { ...updated[index], quantity: normalizeOrderQuantity(value) };
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
      const formError = validateOrderForm();
      if (formError) {
        setError(formError);
        return;
      }

      const availabilityError = validateLineItemAvailability();
      if (availabilityError) {
        setError(availabilityError);
        return;
      }

      setError(null);
      await orderService.create({
        tableIdentifier: formData.tableIdentifier.trim(),
        lineItems: lineItems.map(({ dishId, dishName, unitPrice, quantity }) => ({
          dishId,
          dishName,
          unitPrice,
          quantity,
        })),
      });

      closeModal();
      void loadData();
    } catch (err) {
      setError(toErrorMessage(err, 'orders.createError'));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.order) {
      try {
        await orderService.delete(deleteConfirm.order.id);
        setDeleteConfirm({ open: false, order: null });
        void loadData();
      } catch (err) {
        setError(toErrorMessage(err, 'orders.deleteError'));
      }
    }
  };

  const handleAdvanceStatus = async (order: Order) => {
    try {
      await orderService.advanceStatus(order.id);
      void loadData();
    } catch (err) {
      setError(toErrorMessage(err, 'orders.loadError'));
    }
  };

  const handleCancelStatus = async (order: Order) => {
    try {
      await orderService.cancelStatus(order.id);
      void loadData();
    } catch (err) {
      setError(toErrorMessage(err, 'orders.loadError'));
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
          {formatCurrency(row.totalAmount)}
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
          {row.status !== 'ENTREGADA' && (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteConfirm({ open: true, order: row })}
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
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

      {errorMessage && <Alert severity="error" sx={{ mb: 2.5 }}>{errorMessage}</Alert>}

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
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Stack direction="row" spacing={2}>
              <TextField
                label={t('orders.tableIdentifier')}
                fullWidth
                value={formData.tableIdentifier}
                onChange={(e) => setFormData({ ...formData, tableIdentifier: e.target.value })}
                required
                inputProps={{ maxLength: MAX_TABLE_IDENTIFIER_LENGTH }}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('orders.lineItems')}
              </Typography>
              {lineItems.map((item, index) => {
                const selectedDish = getDishById(item.dishId);
                const availabilityLimit = selectedDish && hasRecipeAvailability(selectedDish)
                  ? selectedDish.availableOrders ?? 0
                  : null;

                return (
                  <Paper key={index} sx={{ p: { xs: 2, sm: 2.25 }, mb: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                        <FormControl sx={{ flexGrow: 1, minWidth: { md: 280 } }}>
                          <InputLabel>{t('orders.dish')}</InputLabel>
                          <Select
                            value={item.dishId}
                            label={t('orders.dish')}
                            onChange={(e) => updateLineItem(index, 'dishId', e.target.value)}
                          >
                            {dishes.map((dish) => (
                              <MenuItem key={dish.id} value={dish.id} disabled={isDishUnavailable(dish)}>
                                {dish.name} - {formatCurrency(dish.price)}
                                {isDishUnavailable(dish) ? ` (${t('orders.unavailableDish')})` : ''}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label={t('orders.quantity')}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                          InputProps={{
                            inputProps: {
                              min: 1,
                              max: Math.min(availabilityLimit ?? MAX_ORDER_ITEM_QUANTITY, MAX_ORDER_ITEM_QUANTITY),
                              step: 1,
                            },
                          }}
                          sx={{ width: { xs: '100%', md: 110 } }}
                        />
                        <Typography variant="body2" sx={{ minWidth: { md: 88 }, fontWeight: 700 }}>
                          {formatCurrency(item.unitPrice)}
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1 && index === 0}
                        >
                          <Remove />
                        </IconButton>
                      </Stack>
                      {selectedDish && hasRecipeAvailability(selectedDish) && (
                        <Typography
                          variant="caption"
                          color={(selectedDish.availableOrders ?? 0) > 0 ? 'text.secondary' : 'error.main'}
                        >
                          {(selectedDish.availableOrders ?? 0) > 0
                            ? t('orders.availableDishCount', { count: selectedDish.availableOrders ?? 0 })
                            : t('orders.noDishStock')}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
              <Button
                startIcon={<AddCircle />}
                onClick={addLineItem}
                disabled={!hasAvailableDishes || lineItems.length >= MAX_ORDER_LINE_ITEMS}
              >
                {t('orders.addItem')}
              </Button>
              {!hasAvailableDishes && dishes.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {t('orders.noAvailableDishes')}
                </Alert>
              )}
            </Box>

            <Paper sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: 'background.default' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="h6">{t('orders.total')}</Typography>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 850, whiteSpace: 'nowrap' }}>
                  {formatCurrency(getTotal())}
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
            disabled={lineItems.length === 0 || !formData.tableIdentifier || !hasAvailableDishes}
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

      <ConfirmDialog
        open={discardConfirmOpen}
        title={t('common.unsavedChangesTitle')}
        message={t('common.unsavedChangesMessage')}
        confirmText={t('common.discardChanges')}
        cancelText={t('common.keepEditing')}
        onConfirm={handleDiscardOrderChanges}
        onCancel={() => setDiscardConfirmOpen(false)}
      />
    </Box>
  );
}
