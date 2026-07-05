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
  Stack,
  Alert,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import AddCircle from '@mui/icons-material/AddCircle';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import Restaurant from '@mui/icons-material/Restaurant';
import { PageHeader, ConfirmDialog, DataTable, EmptyState } from '@/components/common';
import { dishService, productService } from '@/services';
import type { Dish, Column, Product } from '@/types';
import { useI18n } from '@/i18n';
import { formatCurrency, getDisplayCurrencySymbol } from '@/utils';
import { getLocalizedErrorMessage, toErrorMessage, translatedError, type ErrorMessage } from '@/utils/errorMessages';

interface DishRecipeFormItem {
  productId: string;
  requiredQuantity: string;
  requiredUnitOfMeasure: string;
}

interface DishFormData {
  name: string;
  description: string;
  price: string;
  ingredients: string;
  recipeItems: DishRecipeFormItem[];
}

const formatQuantity = (value: number | null | undefined) =>
  (value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 3 });

const MAX_DERIVED_INGREDIENTS_LENGTH = 500;

type UnitDimension = 'mass' | 'volume' | 'count' | 'custom';

const normalizeUnit = (unit: string) =>
  unit.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '');

const getUnitDimension = (unit: string): UnitDimension => {
  const normalized = normalizeUnit(unit);
  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'g', 'gr', 'grs', 'gramo', 'gramos'].includes(normalized)) {
    return 'mass';
  }
  if (['l', 'lt', 'lts', 'litro', 'litros', 'ml', 'mililitro', 'mililitros'].includes(normalized)) {
    return 'volume';
  }
  if (['u', 'und', 'unidad', 'unidades', 'unit', 'units'].includes(normalized)) {
    return 'count';
  }
  return 'custom';
};

const getRecipeUnitOptions = (stockUnit: string) => {
  const dimension = getUnitDimension(stockUnit);
  if (dimension === 'mass') {
    return ['g', 'kg'];
  }
  if (dimension === 'volume') {
    return ['ml', 'l'];
  }
  if (dimension === 'count') {
    return ['unidad'];
  }
  return [stockUnit].filter(Boolean);
};

const getDefaultRecipeUnit = (stockUnit: string) => getRecipeUnitOptions(stockUnit)[0] || stockUnit;

const areUnitsCompatible = (recipeUnit: string, stockUnit: string) => {
  const recipeDimension = getUnitDimension(recipeUnit);
  const stockDimension = getUnitDimension(stockUnit);
  if (recipeDimension === 'custom' || stockDimension === 'custom') {
    return normalizeUnit(recipeUnit) === normalizeUnit(stockUnit);
  }
  return recipeDimension === stockDimension;
};

const getUnitBaseFactor = (unit: string) => {
  const normalized = normalizeUnit(unit);
  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'l', 'lt', 'lts', 'litro', 'litros'].includes(normalized)) {
    return 1000;
  }
  return 1;
};

const convertRecipeQuantityToStockUnit = (quantity: number, recipeUnit: string, stockUnit: string) => {
  if (!areUnitsCompatible(recipeUnit, stockUnit)) {
    return null;
  }

  return quantity * getUnitBaseFactor(recipeUnit) / getUnitBaseFactor(stockUnit);
};

const parseDishPrice = (value: string) => {
  if (value.trim() === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
};

const validateDishForm = (formData: DishFormData): ErrorMessage | null => {
  const price = parseDishPrice(formData.price);

  if (!formData.name.trim()) {
    return translatedError('dishes.validation.nameRequired');
  }

  if (formData.name.trim().length < 2) {
    return translatedError('dishes.validation.nameMin');
  }

  if (price === null) {
    return translatedError('dishes.validation.priceRequired');
  }

  if (Number.isNaN(price)) {
    return translatedError('dishes.validation.priceInvalid');
  }

  if (price <= 0) {
    return translatedError('dishes.validation.pricePositive');
  }

  return null;
};

export default function DishesPage() {
  const { t } = useI18n();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editDish, setEditDish] = useState<Dish | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; dish: Dish | null }>({
    open: false,
    dish: null,
  });
  const [error, setError] = useState<ErrorMessage | null>(null);

  const [formData, setFormData] = useState<DishFormData>({
    name: '',
    description: '',
    price: '',
    ingredients: '',
    recipeItems: [] as DishRecipeFormItem[],
  });

  useEffect(() => {
    void loadDishes();
  }, []);

  const errorMessage = error ? getLocalizedErrorMessage(error, t, 'dishes.loadError') : null;

  const loadDishes = async () => {
    try {
      setLoading(true);
      const [data, productsData] = await Promise.all([
        dishService.getAll(),
        productService.getAll(),
      ]);
      setDishes(data);
      setProducts(productsData);
    } catch (err) {
      setError(toErrorMessage(err, 'dishes.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dish?: Dish) => {
    if (dish) {
      setEditDish(dish);
      setFormData({
        name: dish.name,
        description: dish.description || '',
        price: dish.price.toString(),
        ingredients: dish.ingredients,
        recipeItems: dish.recipeItems.map((item) => ({
          productId: item.productId.toString(),
          requiredQuantity: item.requiredQuantity.toString(),
          requiredUnitOfMeasure: item.requiredUnitOfMeasure || item.unitOfMeasure,
        })),
      });
    } else {
      setEditDish(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        ingredients: '',
        recipeItems: [],
      });
    }
    setOpenModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditDish(null);
  };

  const addRecipeItem = () => {
    const selectedIds = new Set(formData.recipeItems.map((item) => item.productId));
    const nextProduct = products.find((product) => !selectedIds.has(product.id.toString()));
    if (!nextProduct) {
      return;
    }

    setFormData({
      ...formData,
      recipeItems: [
        ...formData.recipeItems,
        {
          productId: nextProduct.id.toString(),
          requiredQuantity: '',
          requiredUnitOfMeasure: getDefaultRecipeUnit(nextProduct.unitOfMeasure),
        },
      ],
    });
  };

  const updateRecipeItem = (index: number, field: keyof DishRecipeFormItem, value: string) => {
    setFormData({
      ...formData,
      recipeItems: formData.recipeItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === 'productId'
                ? {
                    requiredUnitOfMeasure:
                      getProductById(value)
                        ? getDefaultRecipeUnit(getProductById(value)?.unitOfMeasure || '')
                        : item.requiredUnitOfMeasure,
                  }
                : {}),
            }
          : item
      ),
    });
  };

  const removeRecipeItem = (index: number) => {
    setFormData({
      ...formData,
      recipeItems: formData.recipeItems.filter((_item, itemIndex) => itemIndex !== index),
    });
  };

  const getProductById = (productId: string) => products.find((product) => product.id.toString() === productId);

  const estimatedRecipeCost = formData.recipeItems.reduce((totalCost, item) => {
    const product = getProductById(item.productId);
    const requiredQuantity = Number(item.requiredQuantity);
    if (!product || !Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
      return totalCost;
    }

    const quantityInStockUnit = convertRecipeQuantityToStockUnit(
      requiredQuantity,
      item.requiredUnitOfMeasure,
      product.unitOfMeasure
    );

    return quantityInStockUnit === null
      ? totalCost
      : totalCost + quantityInStockUnit * product.unitCost;
  }, 0);
  const priceForPreview = parseDishPrice(formData.price);
  const canShowPricingPreview =
    estimatedRecipeCost > 0 &&
    priceForPreview !== null &&
    !Number.isNaN(priceForPreview);
  const estimatedProfit =
    canShowPricingPreview && priceForPreview !== null
      ? priceForPreview - estimatedRecipeCost
      : null;

  const isProductSelectedInAnotherRecipeRow = (productId: string, rowIndex: number) =>
    formData.recipeItems.some((item, itemIndex) => itemIndex !== rowIndex && item.productId === productId);

  const buildIngredientsSummary = (recipeItems: DishRecipeFormItem[]) => {
    const ingredientNames = recipeItems
      .map((item) => getProductById(item.productId)?.name.trim())
      .filter((name): name is string => Boolean(name));

    const uniqueNames = Array.from(new Set(ingredientNames));
    const summary = uniqueNames.join(', ');

    return summary.length > MAX_DERIVED_INGREDIENTS_LENGTH
      ? `${summary.slice(0, MAX_DERIVED_INGREDIENTS_LENGTH - 3)}...`
      : summary;
  };

  const getDishIngredientsSummary = (dish: Dish) => {
    if (dish.recipeItems.length > 0) {
      const summary = Array.from(
        new Set(dish.recipeItems.map((item) => item.productName).filter(Boolean))
      ).join(', ');
      return summary || dish.ingredients || '-';
    }

    return dish.ingredients || '-';
  };

  const buildRecipePayload = () => {
    const recipeItems = formData.recipeItems.filter(
      (item) => item.productId || item.requiredQuantity.trim()
    );
    const productIds = new Set<string>();

    for (const item of recipeItems) {
      const requiredQuantity = Number(item.requiredQuantity);
      if (!item.productId || !Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
        setError(translatedError('dishes.recipeInvalid'));
        return null;
      }
      const product = getProductById(item.productId);
      if (!product || !item.requiredUnitOfMeasure.trim() || !areUnitsCompatible(item.requiredUnitOfMeasure, product.unitOfMeasure)) {
        setError(translatedError('dishes.recipeUnitInvalid'));
        return null;
      }
      if (productIds.has(item.productId)) {
        setError(translatedError('dishes.recipeDuplicateProduct'));
        return null;
      }
      productIds.add(item.productId);
    }

    return recipeItems.map((item) => ({
      productId: Number(item.productId),
      requiredQuantity: Number(item.requiredQuantity),
      requiredUnitOfMeasure: item.requiredUnitOfMeasure.trim(),
    }));
  };

  const handleSubmit = async () => {
    const validationError = validateDishForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const recipeItems = buildRecipePayload();
      if (recipeItems === null) {
        return;
      }

      const derivedIngredients = buildIngredientsSummary(formData.recipeItems);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        ingredients: derivedIngredients || formData.ingredients.trim(),
        recipeItems,
      };

      if (editDish) {
        await dishService.update(editDish.id, payload);
      } else {
        await dishService.create(payload);
      }

      handleCloseModal();
      void loadDishes();
    } catch (err) {
      setError(toErrorMessage(err, 'dishes.saveError'));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.dish) {
      try {
        await dishService.delete(deleteConfirm.dish.id);
        setDeleteConfirm({ open: false, dish: null });
        void loadDishes();
      } catch (err) {
        setError(toErrorMessage(err, 'dishes.deleteError'));
      }
    }
  };

  const filteredDishes = dishes.filter(
    (dish) =>
      dish.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Dish>[] = [
    {
      id: 'name',
      label: t('dishes.name'),
      render: (row: Dish) => (
        <Box sx={{ fontWeight: 'medium' }}>{row.name}</Box>
      ),
    },
    {
      id: 'description',
      label: t('dishes.description'),
      render: (row: Dish) => row.description || '-',
    },
    {
      id: 'price',
      label: t('dishes.price'),
      render: (row: Dish) => formatCurrency(row.price),
    },
    {
      id: 'availableOrders',
      label: t('dishes.availableOrders'),
      render: (row: Dish) => {
        if (!row.recipeItems.length || row.availableOrders === null || row.availableOrders === undefined) {
          return <Chip label={t('dishes.noRecipe')} size="small" variant="outlined" />;
        }

        return (
          <Chip
            label={
              row.availableOrders > 0
                ? t('dishes.availableOrdersCount', { count: row.availableOrders })
                : t('dishes.unavailable')
            }
            color={row.availableOrders > 0 ? 'success' : 'error'}
            size="small"
          />
        );
      },
    },
    {
      id: 'ingredients',
      label: t('dishes.ingredients'),
      render: (row: Dish) => (
        <Stack spacing={0.75}>
          <Box>{getDishIngredientsSummary(row)}</Box>
          {row.recipeItems.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {t('dishes.recipeItemsCount', { count: row.recipeItems.length })}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      id: 'actions',
      label: t('common.actions'),
      render: (row: Dish) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => handleOpenModal(row)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteConfirm({ open: true, dish: row })}
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
        title={t('dishes.title')}
        subtitle={t('dishes.subtitle')}
      />

      {errorMessage && <Alert severity="error" sx={{ mb: 2.5 }}>{errorMessage}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            placeholder={t('dishes.search')}
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('dishes.add')}
          </Button>
        </Stack>
      </Box>

      {filteredDishes.length === 0 ? (
        <EmptyState
          icon={<Restaurant fontSize="large" />}
          title={search ? t('dishes.noFoundTitle') : t('dishes.emptyTitle')}
          description={search ? t('dishes.noFoundDescription') : t('dishes.emptyDescription')}
          action={
            !search && (
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}>
                {t('dishes.add')}
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredDishes}
          rowId={(row) => row.id}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: 'calc(100% - 24px)', md: 920 },
          },
        }}
      >
        <DialogTitle>{editDish ? t('dishes.editTitle') : t('dishes.addTitle')}</DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <TextField
              label={t('dishes.name')}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label={t('dishes.description')}
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label={t('dishes.price')}
              type="number"
              fullWidth
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">{getDisplayCurrencySymbol()}</InputAdornment>,
              }}
            />
            {canShowPricingPreview && estimatedProfit !== null && (
              <Alert severity={estimatedProfit < 0 ? 'error' : estimatedProfit === 0 ? 'warning' : 'success'}>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {estimatedProfit < 0
                      ? t('dishes.pricingLoss', { amount: formatCurrency(Math.abs(estimatedProfit)) })
                      : t('dishes.pricingProfit', { amount: formatCurrency(estimatedProfit) })}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Typography variant="body2">
                      {t('dishes.estimatedCost', { amount: formatCurrency(estimatedRecipeCost) })}
                    </Typography>
                    <Typography variant="body2">
                      {t('dishes.estimatedPrice', { amount: formatCurrency(priceForPreview || 0) })}
                    </Typography>
                  </Stack>
                </Stack>
              </Alert>
            )}
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: 'background.default' }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {t('dishes.recipe')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('dishes.recipeHelp')}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddCircle />}
                    onClick={addRecipeItem}
                    disabled={products.length === 0 || formData.recipeItems.length >= products.length}
                  >
                    {t('dishes.addRecipeItem')}
                  </Button>
                </Stack>

                {products.length === 0 && (
                  <Alert severity="info">{t('dishes.noProductsForRecipe')}</Alert>
                )}

                {formData.recipeItems.map((item, index) => {
                  const product = getProductById(item.productId);
                  const unitOptions = product ? getRecipeUnitOptions(product.unitOfMeasure) : [];
                  return (
                    <Box
                      key={`${item.productId}-${index}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: 'minmax(260px, 1.6fr) 150px 120px minmax(130px, 0.8fr) 44px',
                        },
                        gap: 1.5,
                        alignItems: 'center',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <FormControl fullWidth>
                        <InputLabel>{t('products.product')}</InputLabel>
                        <Select
                          value={item.productId}
                          label={t('products.product')}
                          onChange={(event) => updateRecipeItem(index, 'productId', String(event.target.value))}
                        >
                          {products.map((productOption) => (
                            <MenuItem
                              key={productOption.id}
                              value={productOption.id.toString()}
                              disabled={isProductSelectedInAnotherRecipeRow(productOption.id.toString(), index)}
                            >
                              {productOption.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label={t('dishes.requiredQuantityShort')}
                        type="number"
                        fullWidth
                        value={item.requiredQuantity}
                        onChange={(event) => updateRecipeItem(index, 'requiredQuantity', event.target.value)}
                        InputProps={{
                          inputProps: { min: 0.001, step: 'any' },
                        }}
                      />
                      <FormControl fullWidth>
                        <InputLabel>{t('dishes.requiredUnit')}</InputLabel>
                        <Select
                          value={item.requiredUnitOfMeasure}
                          label={t('dishes.requiredUnit')}
                          onChange={(event) => updateRecipeItem(index, 'requiredUnitOfMeasure', String(event.target.value))}
                        >
                          {unitOptions.map((unit) => (
                            <MenuItem key={unit} value={unit}>
                              {unit}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="body2" color="text.secondary">
                        {product
                          ? t('dishes.recipeStockHint', {
                              stock: formatQuantity(product.stockLevel),
                              unit: product.unitOfMeasure,
                            })
                          : t('common.unknown')}
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => removeRecipeItem(index)}
                        aria-label={t('common.delete')}
                        sx={{ justifySelf: { xs: 'end', md: 'center' } }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  );
                })}

                {formData.recipeItems.length === 0 && products.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t('dishes.emptyRecipe')}
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleCloseModal}>{t('common.cancel')}</Button>
          <Button onClick={() => void handleSubmit()} variant="contained">
            {editDish ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title={t('dishes.deleteTitle')}
        message={t('dishes.deleteMessage', { name: deleteConfirm.dish?.name || '' })}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteConfirm({ open: false, dish: null })}
      />
    </Box>
  );
}
