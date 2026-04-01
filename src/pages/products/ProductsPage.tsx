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
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, Warning } from '@mui/icons-material';
import { PageHeader, ConfirmDialog, DataTable, EmptyState } from '@/components/common';
import { productService } from '@/services';
import type { Product, Column } from '@/types';
import { Inventory2Outlined } from '@mui/icons-material';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stockLevel: '',
    unitOfMeasure: '',
    unitCost: '',
    lowStockThreshold: '',
    category: '',
    supplier: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        stockLevel: product.stockLevel.toString(),
        unitOfMeasure: product.unitOfMeasure,
        unitCost: product.unitCost.toString(),
        lowStockThreshold: product.lowStockThreshold.toString(),
        category: product.category || '',
        supplier: product.supplier || '',
      });
    } else {
      setEditProduct(null);
      setFormData({
        name: '',
        description: '',
        stockLevel: '',
        unitOfMeasure: '',
        unitCost: '',
        lowStockThreshold: '10',
        category: '',
        supplier: '',
      });
    }
    setOpenModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditProduct(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        stockLevel: parseFloat(formData.stockLevel),
        unitOfMeasure: formData.unitOfMeasure,
        unitCost: parseFloat(formData.unitCost),
        lowStockThreshold: parseFloat(formData.lowStockThreshold),
        category: formData.category || undefined,
        supplier: formData.supplier || undefined,
      };

      if (editProduct) {
        await productService.update(editProduct.id, payload);
      } else {
        await productService.create(payload);
      }

      handleCloseModal();
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.product) {
      try {
        await productService.delete(deleteConfirm.product.id);
        setDeleteConfirm({ open: false, product: null });
        loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete product');
      }
    }
  };

  const isLowStock = (product: Product) => product.stockLevel <= product.lowStockThreshold;

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase()) ||
      product.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Product>[] = [
    {
      id: 'name',
      label: 'Product',
      render: (row: Product) => (
        <Box>
          <Box sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', gap: 1 }}>
            {row.name}
            {isLowStock(row) && <Warning fontSize="small" color="warning" />}
          </Box>
          {row.category && (
            <Chip label={row.category} size="small" sx={{ mt: 0.5 }} />
          )}
        </Box>
      ),
    },
    {
      id: 'stock',
      label: 'Stock Level',
      render: (row: Product) => (
        <Chip
          label={`${row.stockLevel} ${row.unitOfMeasure}`}
          color={isLowStock(row) ? 'warning' : 'success'}
          size="small"
        />
      ),
    },
    {
      id: 'unitCost',
      label: 'Unit Cost',
      render: (row: Product) => `$${row.unitCost.toFixed(2)}`,
    },
    {
      id: 'value',
      label: 'Total Value',
      render: (row: Product) => `$${(row.stockLevel * row.unitCost).toFixed(2)}`,
    },
    {
      id: 'supplier',
      label: 'Supplier',
      render: (row: Product) => row.supplier || '-',
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row: Product) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => handleOpenModal(row)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteConfirm({ open: true, product: row })}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const lowStockCount = products.filter((p) => isLowStock(p)).length;

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle="Manage your restaurant inventory and supplies"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
          >
            Add Product
          </Button>
        }
      />

      {lowStockCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} running low on stock
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Inventory2Outlined fontSize="large" />}
          title={search ? 'No products found' : 'No products yet'}
          description={search ? 'Try a different search term' : 'Add your first product to start tracking inventory'}
          action={
            !search && (
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}>
                Add Product
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredProducts}
          rowId={(row) => row.id}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Product Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Stock Level"
                type="number"
                fullWidth
                value={formData.stockLevel}
                onChange={(e) => setFormData({ ...formData, stockLevel: e.target.value })}
                required
              />
              <TextField
                label="Unit of Measure"
                fullWidth
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                placeholder="e.g., kg, liters, units"
                required
              />
            </Stack>
            <TextField
              label="Unit Cost"
              type="number"
              fullWidth
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              label="Low Stock Threshold"
              type="number"
              fullWidth
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              helperText="Alert when stock falls below this level"
            />
            <TextField
              label="Category"
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Produce, Dairy, Meat"
            />
            <TextField
              label="Supplier"
              fullWidth
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm.product?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, product: null })}
      />
    </Box>
  );
}
