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
import { useI18n } from '@/i18n';

export default function ProductsPage() {
  const { t } = useI18n();
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
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.loadError'));
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
      void loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.saveError'));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.product) {
      try {
        await productService.delete(deleteConfirm.product.id);
        setDeleteConfirm({ open: false, product: null });
        void loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('products.deleteError'));
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
      label: t('products.product'),
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
      label: t('products.stockLevel'),
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
      label: t('products.unitCost'),
      render: (row: Product) => `$${row.unitCost.toFixed(2)}`,
    },
    {
      id: 'value',
      label: t('products.totalValue'),
      render: (row: Product) => `$${(row.stockLevel * row.unitCost).toFixed(2)}`,
    },
    {
      id: 'supplier',
      label: t('products.supplier'),
      render: (row: Product) => row.supplier || '-',
    },
    {
      id: 'actions',
      label: t('common.actions'),
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
    return <Box>{t('common.loading')}</Box>;
  }

  return (
    <Box>
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
          >
            {t('products.add')}
          </Button>
        }
      />

      {lowStockCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          {t('products.lowStockAlert', { count: lowStockCount })}
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder={t('products.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 360 } }}
        />
      </Box>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Inventory2Outlined fontSize="large" />}
          title={search ? t('products.noFoundTitle') : t('products.emptyTitle')}
          description={search ? t('products.noFoundDescription') : t('products.emptyDescription')}
          action={
            !search && (
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}>
                {t('products.add')}
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
        <DialogTitle>{editProduct ? t('products.editTitle') : t('products.addTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={t('products.name')}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label={t('products.description')}
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('products.stockLevel')}
                type="number"
                fullWidth
                value={formData.stockLevel}
                onChange={(e) => setFormData({ ...formData, stockLevel: e.target.value })}
                required
              />
              <TextField
                label={t('products.unitOfMeasure')}
                fullWidth
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                placeholder={t('products.unitOfMeasurePlaceholder')}
                required
              />
            </Stack>
            <TextField
              label={t('products.unitCost')}
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
              label={t('products.lowStockThreshold')}
              type="number"
              fullWidth
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              helperText={t('products.lowStockHelp')}
            />
            <TextField
              label={t('products.category')}
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder={t('products.categoryPlaceholder')}
            />
            <TextField
              label={t('products.supplier')}
              fullWidth
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleCloseModal}>{t('common.cancel')}</Button>
          <Button onClick={() => void handleSubmit()} variant="contained">
            {editProduct ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title={t('products.deleteTitle')}
        message={t('products.deleteMessage', { name: deleteConfirm.product?.name || '' })}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteConfirm({ open: false, product: null })}
      />
    </Box>
  );
}
