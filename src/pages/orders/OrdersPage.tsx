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

const orderTypes: { value: OrderType; label: string }[] = [
  { value: 'DINE_IN', label: 'Dine In' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'DELIVERY', label: 'Delivery' },
];

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

export default function OrdersPage() {
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
    customerName: '',
    orderType: 'TAKEAWAY' as OrderType,
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, dishesData] = await Promise.all([
        orderService.getAll(),
        dishService.getAll(),
      ]);
      setOrders(ordersData);
      setDishes(dishesData.filter((d) => d.available));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      customerName: '',
      orderType: 'TAKEAWAY',
      notes: '',
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
    setLineItems([...lineItems, { dishId: 0, quantity: 1, dishName: '', unitPrice: 0 }]);
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
        setError('Please add at least one item to the order');
        return;
      }

      await orderService.create({
        customerName: formData.customerName || undefined,
        orderType: formData.orderType,
        notes: formData.notes || undefined,
        lineItems: lineItems.map(({ dishId, quantity }) => ({ dishId, quantity })),
      });

      handleCloseModal();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.order) {
      try {
        await orderService.delete(deleteConfirm.order.id);
        setDeleteConfirm({ open: false, order: null });
        loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete order');
      }
    }
  };

  const columns: Column<Order>[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      render: (row: Order) => (
        <Box sx={{ fontWeight: 'bold' }}>#{row.orderNumber.slice(-6)}</Box>
      ),
    },
    {
      id: 'customer',
      label: 'Customer',
      render: (row: Order) => row.customerName || 'Walk-in',
    },
    {
      id: 'type',
      label: 'Type',
      render: (row: Order) => (
        <Chip
          label={orderTypes.find((t) => t.value === row.orderType)?.label || row.orderType}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'items',
      label: 'Items',
      render: (row: Order) => `${row.lineItems.length} item${row.lineItems.length !== 1 ? 's' : ''}`,
    },
    {
      id: 'total',
      label: 'Total',
      render: (row: Order) => (
        <Typography variant="body2" fontWeight="bold">
          ${row.totalAmount.toFixed(2)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row: Order) => (
        <Chip label={row.status} color={statusColors[row.status]} size="small" />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
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
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenModal}
          >
            New Order
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {orders.length === 0 ? (
        <EmptyState
          icon={<Receipt fontSize="large" />}
          title="No orders yet"
          description="Create your first order to get started"
          action={
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenModal}>
              New Order
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
        <DialogTitle>Create New Order</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction="row" spacing={2}>
              <TextField
                label="Customer Name (optional)"
                fullWidth
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={formData.orderType}
                  label="Order Type"
                  onChange={(e) => setFormData({ ...formData, orderType: e.target.value as OrderType })}
                >
                  {orderTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Line Items
              </Typography>
              {lineItems.map((item, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl sx={{ flexGrow: 1 }}>
                      <InputLabel>Dish</InputLabel>
                      <Select
                        value={item.dishId}
                        label="Dish"
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
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      InputProps={{
                        inputProps: { min: 1 },
                      }}
                      sx={{ width: 100 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 80 }}>
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
                Add Item
              </Button>
            </Box>

            <TextField
              label="Notes (optional)"
              multiline
              rows={2}
              fullWidth
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions..."
            />

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h4" color="primary.main">
                  ${getTotal().toFixed(2)}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={lineItems.length === 0}>
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Order"
        message={`Are you sure you want to delete order #${deleteConfirm.order?.orderNumber.slice(-6)}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, order: null })}
      />
    </Box>
  );
}
