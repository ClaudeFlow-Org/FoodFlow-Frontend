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
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Add, Edit, Delete, Search, Warning, Category as CategoryIcon } from '@mui/icons-material';
import { PageHeader, ConfirmDialog, DataTable, EmptyState } from '@/components/common';
import { productService } from '@/services';
import type { Product, ProductCategory, Column } from '@/types';
import { Inventory2Outlined } from '@mui/icons-material';
import { useI18n } from '@/i18n';
import {
  getLocalizedErrorMessage,
  toErrorMessage,
  translatedError,
  type ErrorMessage,
} from '@/utils/errorMessages';

const PRODUCT_STOCK_LIMIT = 5000;
const MAX_PRODUCT_COST = 999_999;
const LOW_STOCK_THRESHOLD_LIMIT = 5000;

interface ProductFormData {
  name: string;
  description: string;
  stockLevel: string;
  unitOfMeasure: string;
  unitCost: string;
  lowStockThreshold: string;
  category: string;
  supplier: string;
}

const parseFormNumber = (value: string) => {
  if (value.trim() === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
};

const validateProductForm = (formData: ProductFormData): ErrorMessage | null => {
  const stockLevel = parseFormNumber(formData.stockLevel);
  const unitCost = parseFormNumber(formData.unitCost);
  const lowStockThreshold = parseFormNumber(formData.lowStockThreshold);

  if (!formData.name.trim()) {
    return translatedError('products.validation.nameRequired');
  }

  if (stockLevel === null) {
    return translatedError('products.validation.stockRequired');
  }

  if (Number.isNaN(stockLevel)) {
    return translatedError('products.validation.stockInvalid');
  }

  if (stockLevel < 0) {
    return translatedError('products.validation.stockNonNegative');
  }

  if (stockLevel >= PRODUCT_STOCK_LIMIT) {
    return translatedError('products.validation.stockMax', { limit: PRODUCT_STOCK_LIMIT });
  }

  if (!formData.unitOfMeasure.trim()) {
    return translatedError('products.validation.unitRequired');
  }

  if (unitCost === null) {
    return translatedError('products.validation.unitCostRequired');
  }

  if (Number.isNaN(unitCost)) {
    return translatedError('products.validation.unitCostInvalid');
  }

  if (unitCost < 0) {
    return translatedError('products.validation.unitCostNonNegative');
  }

  if (unitCost > MAX_PRODUCT_COST) {
    return translatedError('products.validation.unitCostMax', { max: MAX_PRODUCT_COST });
  }

  if (Number.isNaN(lowStockThreshold)) {
    return translatedError('products.validation.lowStockInvalid');
  }

  if (lowStockThreshold !== null && lowStockThreshold < 0) {
    return translatedError('products.validation.lowStockNonNegative');
  }

  if (lowStockThreshold !== null && lowStockThreshold >= LOW_STOCK_THRESHOLD_LIMIT) {
    return translatedError('products.validation.lowStockMax', { limit: LOW_STOCK_THRESHOLD_LIMIT });
  }

  return null;
};

export default function ProductsPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState('');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ open: boolean; category: ProductCategory | null }>({
    open: false,
    category: null,
  });
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [categoryError, setCategoryError] = useState<ErrorMessage | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
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

  const errorMessage = error ? getLocalizedErrorMessage(error, t, 'products.loadError') : null;
  const categoryErrorMessage = categoryError
    ? getLocalizedErrorMessage(categoryError, t, 'products.categorySaveError')
    : null;

  const loadProducts = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(toErrorMessage(err, 'products.loadError'));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
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

  const resetCategoryForm = () => {
    setCategoryForm('');
    setEditingCategory(null);
  };

  const handleOpenCategoryDialog = () => {
    setCategoryError(null);
    resetCategoryForm();
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setCategoryError(null);
    resetCategoryForm();
  };

  const handleSaveCategory = async () => {
    const name = categoryForm.trim();
    if (!name) {
      setCategoryError(translatedError('products.categoryNameRequired'));
      return;
    }

    try {
      setCategoryError(null);
      if (editingCategory) {
        await productService.updateCategory(editingCategory.id, name);
      } else {
        await productService.createCategory(name);
      }
      resetCategoryForm();
      void loadProducts(false);
    } catch (err) {
      setCategoryError(toErrorMessage(err, 'products.categorySaveError'));
    }
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryForm(category.name);
    setCategoryError(null);
  };

  const handleSubmit = async () => {
    const validationError = validateProductForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const selectedCategory = formData.category.trim();
      const lowStockThreshold = parseFormNumber(formData.lowStockThreshold);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        stockLevel: Number(formData.stockLevel),
        unitOfMeasure: formData.unitOfMeasure.trim(),
        unitCost: Number(formData.unitCost),
        lowStockThreshold: lowStockThreshold === null ? undefined : lowStockThreshold,
        supplier: formData.supplier.trim() || undefined,
      };

      let savedProduct: Product;
      if (editProduct) {
        savedProduct = await productService.update(editProduct.id, payload);
        savedProduct = await productService.updateProductCategory(editProduct.id, selectedCategory);
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === savedProduct.id ? savedProduct : product
          )
        );
      } else {
        savedProduct = await productService.create(payload);
        if (selectedCategory) {
          savedProduct = await productService.updateProductCategory(savedProduct.id, selectedCategory);
        }
        setProducts((currentProducts) => [savedProduct, ...currentProducts]);
      }

      handleCloseModal();
    } catch (err) {
      setError(toErrorMessage(err, 'products.saveError'));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.product) {
      try {
        await productService.delete(deleteConfirm.product.id);
        setDeleteConfirm({ open: false, product: null });
        void loadProducts();
      } catch (err) {
        setError(toErrorMessage(err, 'products.deleteError'));
      }
    }
  };

  const handleDeleteCategory = async () => {
    if (deleteCategoryConfirm.category) {
      try {
        await productService.deleteCategory(deleteCategoryConfirm.category.id);
        if (formData.category === deleteCategoryConfirm.category.name) {
          setFormData({ ...formData, category: '' });
        }
        setDeleteCategoryConfirm({ open: false, category: null });
        resetCategoryForm();
        void loadProducts(false);
      } catch (err) {
        setCategoryError(toErrorMessage(err, 'products.categoryDeleteError'));
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
          <Chip
            label={row.category || t('products.noCategory')}
            size="small"
            variant={row.category ? 'filled' : 'outlined'}
            color={row.category ? 'default' : 'warning'}
            sx={{ mt: 0.5 }}
          />
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
  const categoryOptions = categories.map((category) => category.name);

  if (loading) {
    return <Box>{t('common.loading')}</Box>;
  }

  return (
    <Box>
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={handleOpenCategoryDialog}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('products.manageCategories')}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('products.add')}
            </Button>
          </Stack>
        }
      />

      {lowStockCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          {t('products.lowStockAlert', { count: lowStockCount })}
        </Alert>
      )}

      {errorMessage && <Alert severity="error" sx={{ mb: 2.5 }}>{errorMessage}</Alert>}

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
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
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
                InputProps={{
                  inputProps: { min: 0, max: PRODUCT_STOCK_LIMIT - 1, step: 'any' },
                }}
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
                inputProps: { min: 0, max: MAX_PRODUCT_COST, step: 'any' },
              }}
            />
            <TextField
              label={t('products.lowStockThreshold')}
              type="number"
              fullWidth
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              helperText={t('products.lowStockHelp')}
              InputProps={{
                inputProps: { min: 0, max: LOW_STOCK_THRESHOLD_LIMIT - 1, step: 'any' },
              }}
            />
            <Autocomplete
              freeSolo
              options={categoryOptions}
              value={formData.category}
              onChange={(_event, value) => setFormData({ ...formData, category: value || '' })}
              onInputChange={(_event, value) => setFormData({ ...formData, category: value })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('products.category')}
                  placeholder={t('products.categoryPlaceholder')}
                />
              )}
            />
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                bgcolor: 'action.hover',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('products.quickCategories')}
                </Typography>
                <Button size="small" startIcon={<CategoryIcon />} onClick={handleOpenCategoryDialog}>
                  {t('products.manageCategories')}
                </Button>
              </Stack>
              <ToggleButtonGroup
                exclusive
                value={formData.category || ''}
                onChange={(_event, value: string | null) => setFormData({ ...formData, category: value || '' })}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.75,
                    m: 0,
                    '&.Mui-selected': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="" size="small">
                  {t('products.noCategory')}
                </ToggleButton>
                {categoryOptions.map((category) => (
                  <ToggleButton key={category} value={category} size="small">
                    {category}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {categoryOptions.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('products.noCategories')}
                </Typography>
              )}
            </Box>
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

      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('products.manageCategories')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ mt: 1 }}>
            {categoryErrorMessage && <Alert severity="error">{categoryErrorMessage}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label={editingCategory ? t('products.renameCategory') : t('products.newCategory')}
                fullWidth
                value={categoryForm}
                onChange={(e) => setCategoryForm(e.target.value)}
                placeholder={t('products.categoryPlaceholder')}
              />
              <Button variant="contained" onClick={() => void handleSaveCategory()} sx={{ whiteSpace: 'nowrap' }}>
                {editingCategory ? t('common.update') : t('common.create')}
              </Button>
              {editingCategory && (
                <Button variant="text" onClick={resetCategoryForm} sx={{ whiteSpace: 'nowrap' }}>
                  {t('common.cancel')}
                </Button>
              )}
            </Stack>

            {categories.length > 0 ? (
              <List disablePadding>
                {categories.map((category) => (
                  <ListItem
                    key={category.id}
                    disableGutters
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleEditCategory(category)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteCategoryConfirm({ open: true, category })}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                    sx={{ pr: 9 }}
                  >
                    <ListItemText
                      primary={category.name}
                      secondary={t('products.categoryUsage', {
                        count: products.filter((product) => product.category === category.name).length,
                      })}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">{t('products.noCategories')}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleCloseCategoryDialog}>{t('common.close')}</Button>
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

      <ConfirmDialog
        open={deleteCategoryConfirm.open}
        title={t('products.deleteCategoryTitle')}
        message={t('products.deleteCategoryMessage', { name: deleteCategoryConfirm.category?.name || '' })}
        onConfirm={() => void handleDeleteCategory()}
        onCancel={() => setDeleteCategoryConfirm({ open: false, category: null })}
      />
    </Box>
  );
}
