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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader, ConfirmDialog, DataTable, EmptyState, SnackbarNotice } from '@/components/common';
import { productService } from '@/services';
import type { Product, ProductCategory, Column } from '@/types';
import { Inventory2Outlined } from '@mui/icons-material';
import { useI18n } from '@/i18n';
import { createCategorySchema, createProductSchema } from '@/validation/schemas';
import { useRevalidateOnLanguageChange } from '@/hooks';

export default function ProductsPage() {
  const { t, language } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ open: boolean; category: ProductCategory | null }>({
    open: false,
    category: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categorySubmitError, setCategorySubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const productSchema = useMemo(() => createProductSchema(t), [t]);
  const categorySchema = useMemo(() => createCategorySchema(t), [t]);

  type ProductFormData = z.infer<ReturnType<typeof createProductSchema>>;
  type CategoryFormData = z.infer<ReturnType<typeof createCategorySchema>>;

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      stockLevel: undefined,
      unitOfMeasure: '',
      unitCost: undefined,
      lowStockThreshold: 10,
      category: '',
      supplier: '',
    },
  });

  const {
    register: registerCategory,
    handleSubmit: handleCategorySubmit,
    reset: resetCategory,
    trigger: triggerCategory,
    formState: { errors: categoryErrors, isSubmitting: isCategorySubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
    },
  });

  useRevalidateOnLanguageChange(trigger, language);
  useRevalidateOnLanguageChange(triggerCategory, language);

  const [categoryValue, setCategoryValue] = useState('');

  useEffect(() => {
    void loadProducts();
  }, []);

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
      setError(err instanceof Error ? err.message : t('products.loadError'));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditProduct(product);
      reset({
        name: product.name,
        description: product.description || '',
        stockLevel: product.stockLevel,
        unitOfMeasure: product.unitOfMeasure,
        unitCost: product.unitCost,
        lowStockThreshold: product.lowStockThreshold,
        category: product.category || '',
        supplier: product.supplier || '',
      });
      setCategoryValue(product.category || '');
    } else {
      setEditProduct(null);
      reset({
        name: '',
        description: '',
        stockLevel: undefined,
        unitOfMeasure: '',
        unitCost: undefined,
        lowStockThreshold: 10,
        category: '',
        supplier: '',
      });
      setCategoryValue('');
    }
    setOpenModal(true);
    setSubmitError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditProduct(null);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    resetCategory({ name: '' });
  };

  const handleOpenCategoryDialog = () => {
    setCategoryError(null);
    setCategorySubmitError(null);
    resetCategoryForm();
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setCategoryError(null);
    setCategorySubmitError(null);
    resetCategoryForm();
  };

  const onSaveCategory = handleCategorySubmit(async (data) => {
    const name = data.name.trim();
    try {
      setCategorySubmitError(null);
      if (editingCategory) {
        await productService.updateCategory(editingCategory.id, name);
        setSuccessMessage(t('notifications.category.updated'));
      } else {
        await productService.createCategory(name);
        setSuccessMessage(t('notifications.category.created'));
      }
      resetCategoryForm();
      void loadProducts(false);
    } catch (err) {
      setCategorySubmitError(err instanceof Error ? err.message : t('products.categorySaveError'));
    }
  });

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    resetCategory({ name: category.name });
    setCategoryError(null);
    setCategorySubmitError(null);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const selectedCategory = categoryValue.trim();
      const payload = {
        name: data.name,
        description: data.description || undefined,
        stockLevel: data.stockLevel,
        unitOfMeasure: data.unitOfMeasure,
        unitCost: data.unitCost,
        lowStockThreshold: data.lowStockThreshold,
        supplier: data.supplier || undefined,
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
        setSuccessMessage(t('notifications.products.updated'));
      } else {
        savedProduct = await productService.create(payload);
        if (selectedCategory) {
          savedProduct = await productService.updateProductCategory(savedProduct.id, selectedCategory);
        }
        setProducts((currentProducts) => [savedProduct, ...currentProducts]);
        setSuccessMessage(t('notifications.products.created'));
      }

      handleCloseModal();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('products.saveError'));
    }
  });

  const handleDelete = async () => {
    if (deleteConfirm.product) {
      try {
        await productService.delete(deleteConfirm.product.id);
        setDeleteConfirm({ open: false, product: null });
        setSuccessMessage(t('notifications.products.deleted'));
        void loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('products.deleteError'));
      }
    }
  };

  const handleDeleteCategory = async () => {
    if (deleteCategoryConfirm.category) {
      try {
        await productService.deleteCategory(deleteCategoryConfirm.category.id);
        if (categoryValue === deleteCategoryConfirm.category.name) {
          setCategoryValue('');
        }
        setDeleteCategoryConfirm({ open: false, category: null });
        resetCategoryForm();
        setSuccessMessage(t('notifications.category.deleted'));
        void loadProducts(false);
      } catch (err) {
        setCategoryError(err instanceof Error ? err.message : t('products.categoryDeleteError'));
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
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <TextField
              {...register('name')}
              label={t('products.name')}
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              {...register('description')}
              label={t('products.description')}
              fullWidth
              multiline
              rows={2}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                {...register('stockLevel', { valueAsNumber: true })}
                label={t('products.stockLevel')}
                type="number"
                fullWidth
                error={!!errors.stockLevel}
                helperText={errors.stockLevel?.message}
                inputProps={{ min: 0, max: 9999999.999, step: 0.001 }}
              />
              <TextField
                {...register('unitOfMeasure')}
                label={t('products.unitOfMeasure')}
                fullWidth
                placeholder={t('products.unitOfMeasurePlaceholder')}
                error={!!errors.unitOfMeasure}
                helperText={errors.unitOfMeasure?.message}
              />
            </Stack>
            <TextField
              {...register('unitCost', { valueAsNumber: true })}
              label={t('products.unitCost')}
              type="number"
              fullWidth
              error={!!errors.unitCost}
              helperText={errors.unitCost?.message}
              inputProps={{ min: 0.01, max: 99999999.99, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              {...register('lowStockThreshold', { valueAsNumber: true })}
              label={t('products.lowStockThreshold')}
              type="number"
              fullWidth
              helperText={errors.lowStockThreshold?.message || t('products.lowStockHelp')}
              error={!!errors.lowStockThreshold}
              inputProps={{ min: 0, max: 99999999.99, step: 0.01 }}
            />
            <Autocomplete
              freeSolo
              options={categoryOptions}
              value={categoryValue}
              onChange={(_event, value) => {
                setCategoryValue(value || '');
                reset((current) => ({ ...current, category: value || '' }));
              }}
              onInputChange={(_event, value) => {
                setCategoryValue(value);
                reset((current) => ({ ...current, category: value }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('products.category')}
                  placeholder={t('products.categoryPlaceholder')}
                  error={!!errors.category}
                  helperText={errors.category?.message}
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
                value={categoryValue || ''}
                onChange={(_event, value) => {
                  const nextValue = value || '';
                  setCategoryValue(nextValue);
                  reset((current) => ({ ...current, category: nextValue }));
                }}
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
              {...register('supplier')}
              label={t('products.supplier')}
              fullWidth
              error={!!errors.supplier}
              helperText={errors.supplier?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleCloseModal}>{t('common.cancel')}</Button>
          <Button onClick={() => void onSubmit()} variant="contained" disabled={isSubmitting}>
            {editProduct ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('products.manageCategories')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ mt: 1 }}>
            {categoryError && <Alert severity="error">{categoryError}</Alert>}
            {categorySubmitError && <Alert severity="error">{categorySubmitError}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                {...registerCategory('name')}
                label={editingCategory ? t('products.renameCategory') : t('products.newCategory')}
                fullWidth
                placeholder={t('products.categoryPlaceholder')}
                error={!!categoryErrors.name}
                helperText={categoryErrors.name?.message}
              />
              <Button
                variant="contained"
                onClick={() => void onSaveCategory()}
                sx={{ whiteSpace: 'nowrap' }}
                disabled={isCategorySubmitting}
              >
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

      <SnackbarNotice
        open={Boolean(successMessage)}
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
    </Box>
  );
}
