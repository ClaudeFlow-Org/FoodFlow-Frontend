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
  MenuItem,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import AddShoppingCart from '@mui/icons-material/AddShoppingCart';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import Warning from '@mui/icons-material/Warning';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import { PageHeader, ConfirmDialog, DataTable, EmptyState } from '@/components/common';
import { productService } from '@/services';
import type { Product, ProductCategory, Column } from '@/types';
import { useI18n } from '@/i18n';
import { formatCurrency, getDisplayCurrencySymbol } from '@/utils';
import {
  getLocalizedErrorMessage,
  toErrorMessage,
  translatedError,
  type ErrorMessage,
} from '@/utils/errorMessages';

const PRODUCT_STOCK_LIMIT = 10000;
const MAX_PRODUCT_COST = 999_999;
const MAX_PRODUCT_UNIT_COST = 999_999;
const LOW_STOCK_THRESHOLD_LIMIT = 10000;
const MAX_PRODUCT_NAME_LENGTH = 100;
const MAX_PRODUCT_DESCRIPTION_LENGTH = 500;
const MAX_PRODUCT_CATEGORY_LENGTH = 80;
const MAX_PRODUCT_SUPPLIER_LENGTH = 200;
const INVENTORY_UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'l', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'unidad', label: 'unidad' },
];
const INVENTORY_UNIT_VALUES = INVENTORY_UNIT_OPTIONS.map((option) => option.value);

const normalizeCategoryKey = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const sortProductCategories = (categories: ProductCategory[]) =>
  [...categories].sort((first, second) =>
    first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
  );

const normalizeInventoryUnit = (unit: string) => {
  const normalized = unit
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '');

  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(normalized)) {
    return 'kg';
  }
  if (['g', 'gr', 'grs', 'gramo', 'gramos'].includes(normalized)) {
    return 'g';
  }
  if (['l', 'lt', 'lts', 'litro', 'litros'].includes(normalized)) {
    return 'l';
  }
  if (['ml', 'mililitro', 'mililitros'].includes(normalized)) {
    return 'ml';
  }
  if (['u', 'und', 'unidad', 'unidades', 'unit', 'units'].includes(normalized)) {
    return 'unidad';
  }

  return INVENTORY_UNIT_VALUES.includes(unit) ? unit : '';
};

interface ProductFormData {
  name: string;
  description: string;
  stockLevel: string;
  unitOfMeasure: string;
  purchaseTotalCost: string;
  lowStockThreshold: string;
  category: string;
  supplier: string;
}

interface PurchaseFormData {
  quantity: string;
  unitOfMeasure: string;
  totalCost: string;
}

const parseFormNumber = (value: string) => {
  if (value.trim() === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
};

const getInventoryUnitDimension = (unit: string) => {
  const normalized = normalizeInventoryUnit(unit);
  if (['kg', 'g'].includes(normalized)) {
    return 'mass';
  }
  if (['l', 'ml'].includes(normalized)) {
    return 'volume';
  }
  if (normalized === 'unidad') {
    return 'count';
  }
  return `custom:${normalizeCategoryKey(unit)}`;
};

const getInventoryUnitBaseFactor = (unit: string) => {
  const normalized = normalizeInventoryUnit(unit);
  if (normalized === 'kg' || normalized === 'l') {
    return 1000;
  }
  return 1;
};

const areInventoryUnitsCompatible = (fromUnit: string, toUnit: string) =>
  getInventoryUnitDimension(fromUnit) === getInventoryUnitDimension(toUnit);

const convertInventoryQuantity = (quantity: number, fromUnit: string, toUnit: string) => {
  if (!areInventoryUnitsCompatible(fromUnit, toUnit)) {
    return null;
  }

  return quantity * getInventoryUnitBaseFactor(fromUnit) / getInventoryUnitBaseFactor(toUnit);
};

const getCompatibleInventoryUnitOptions = (stockUnit: string) =>
  INVENTORY_UNIT_OPTIONS.filter((option) => areInventoryUnitsCompatible(option.value, stockUnit));

const validateProductForm = (formData: ProductFormData): ErrorMessage | null => {
  const stockLevel = parseFormNumber(formData.stockLevel);
  const purchaseTotalCost = parseFormNumber(formData.purchaseTotalCost);
  const lowStockThreshold = parseFormNumber(formData.lowStockThreshold);

  if (!formData.name.trim()) {
    return translatedError('products.validation.nameRequired');
  }

  if (formData.name.trim().length > MAX_PRODUCT_NAME_LENGTH) {
    return translatedError('products.validation.nameMax', { max: MAX_PRODUCT_NAME_LENGTH });
  }

  if (formData.description.trim().length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    return translatedError('products.validation.descriptionMax', { max: MAX_PRODUCT_DESCRIPTION_LENGTH });
  }

  if (formData.category.trim().length > MAX_PRODUCT_CATEGORY_LENGTH) {
    return translatedError('products.validation.categoryMax', { max: MAX_PRODUCT_CATEGORY_LENGTH });
  }

  if (formData.supplier.trim().length > MAX_PRODUCT_SUPPLIER_LENGTH) {
    return translatedError('products.validation.supplierMax', { max: MAX_PRODUCT_SUPPLIER_LENGTH });
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

  if (stockLevel > PRODUCT_STOCK_LIMIT) {
    return translatedError('products.validation.stockMax', { limit: PRODUCT_STOCK_LIMIT });
  }

  if (!formData.unitOfMeasure.trim()) {
    return translatedError('products.validation.unitRequired');
  }

  if (purchaseTotalCost === null) {
    return translatedError('products.validation.purchaseCostRequired');
  }

  if (Number.isNaN(purchaseTotalCost)) {
    return translatedError('products.validation.purchaseCostInvalid');
  }

  if (purchaseTotalCost <= 0) {
    return translatedError('products.validation.purchaseCostPositive');
  }

  if (purchaseTotalCost > MAX_PRODUCT_COST) {
    return translatedError('products.validation.purchaseCostMax', { max: MAX_PRODUCT_COST });
  }

  const calculatedUnitCost = stockLevel > 0 ? purchaseTotalCost / stockLevel : purchaseTotalCost;
  if (calculatedUnitCost > MAX_PRODUCT_UNIT_COST) {
    return translatedError('products.validation.unitCostMax', { max: MAX_PRODUCT_UNIT_COST });
  }

  if (Number.isNaN(lowStockThreshold)) {
    return translatedError('products.validation.lowStockInvalid');
  }

  if (lowStockThreshold !== null && lowStockThreshold < 0) {
    return translatedError('products.validation.lowStockNonNegative');
  }

  if (lowStockThreshold !== null && lowStockThreshold > LOW_STOCK_THRESHOLD_LIMIT) {
    return translatedError('products.validation.lowStockMax', { limit: LOW_STOCK_THRESHOLD_LIMIT });
  }

  return null;
};

const validatePurchaseForm = (formData: PurchaseFormData, product: Product | null): ErrorMessage | null => {
  const quantity = parseFormNumber(formData.quantity);
  const totalCost = parseFormNumber(formData.totalCost);

  if (!product) {
    return translatedError('products.purchaseProductRequired');
  }

  if (quantity === null) {
    return translatedError('products.validation.purchaseQuantityRequired');
  }

  if (Number.isNaN(quantity)) {
    return translatedError('products.validation.purchaseQuantityInvalid');
  }

  if (quantity <= 0) {
    return translatedError('products.validation.purchaseQuantityPositive');
  }

  if (quantity > PRODUCT_STOCK_LIMIT) {
    return translatedError('products.validation.purchaseQuantityMax', { limit: PRODUCT_STOCK_LIMIT });
  }

  if (!formData.unitOfMeasure.trim()) {
    return translatedError('products.validation.unitRequired');
  }

  if (!areInventoryUnitsCompatible(formData.unitOfMeasure, product.unitOfMeasure)) {
    return translatedError('products.validation.purchaseUnitInvalid');
  }

  const convertedQuantity = convertInventoryQuantity(quantity, formData.unitOfMeasure, product.unitOfMeasure);
  if (convertedQuantity === null) {
    return translatedError('products.validation.purchaseUnitInvalid');
  }

  if (product.stockLevel + convertedQuantity > PRODUCT_STOCK_LIMIT) {
    return translatedError('products.validation.stockMax', { limit: PRODUCT_STOCK_LIMIT });
  }

  if (totalCost === null) {
    return translatedError('products.validation.purchaseCostRequired');
  }

  if (Number.isNaN(totalCost)) {
    return translatedError('products.validation.purchaseCostInvalid');
  }

  if (totalCost <= 0) {
    return translatedError('products.validation.purchaseCostPositive');
  }

  if (totalCost > MAX_PRODUCT_COST) {
    return translatedError('products.validation.purchaseCostMax', { max: MAX_PRODUCT_COST });
  }

  const purchaseUnitCost = totalCost / convertedQuantity;
  const currentStockValue = product.stockLevel * product.unitCost;
  const nextUnitCost =
    product.stockLevel > 0
      ? (currentStockValue + totalCost) / (product.stockLevel + convertedQuantity)
      : purchaseUnitCost;
  if (purchaseUnitCost > MAX_PRODUCT_UNIT_COST || nextUnitCost > MAX_PRODUCT_UNIT_COST) {
    return translatedError('products.validation.unitCostMax', { max: MAX_PRODUCT_UNIT_COST });
  }

  return null;
};

const getInitialProductFormData = (product?: Product | null): ProductFormData => {
  if (!product) {
    return {
      name: '',
      description: '',
      stockLevel: '',
      unitOfMeasure: '',
      purchaseTotalCost: '',
      lowStockThreshold: '10',
      category: '',
      supplier: '',
    };
  }

  return {
    name: product.name,
    description: product.description || '',
    stockLevel: product.stockLevel.toString(),
    unitOfMeasure: normalizeInventoryUnit(product.unitOfMeasure),
    purchaseTotalCost: (product.stockLevel * product.unitCost).toString(),
    lowStockThreshold: product.lowStockThreshold.toString(),
    category: product.category || '',
    supplier: product.supplier || '',
  };
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
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [categoryError, setCategoryError] = useState<ErrorMessage | null>(null);
  const [purchaseDialog, setPurchaseDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormData>({
    quantity: '',
    unitOfMeasure: '',
    totalCost: '',
  });
  const [purchaseError, setPurchaseError] = useState<ErrorMessage | null>(null);

  const [formData, setFormData] = useState<ProductFormData>(getInitialProductFormData());

  useEffect(() => {
    void loadProducts();
  }, []);

  const errorMessage = error ? getLocalizedErrorMessage(error, t, 'products.loadError') : null;
  const categoryErrorMessage = categoryError
    ? getLocalizedErrorMessage(categoryError, t, 'products.categorySaveError')
    : null;
  const purchaseErrorMessage = purchaseError
    ? getLocalizedErrorMessage(purchaseError, t, 'products.purchaseSaveError')
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
      setFormData(getInitialProductFormData(product));
    } else {
      setEditProduct(null);
      setFormData(getInitialProductFormData());
    }
    setOpenModal(true);
    setError(null);
  };

  const isProductFormDirty = () => {
    const initialData = getInitialProductFormData(editProduct);
    return (Object.keys(initialData) as Array<keyof ProductFormData>).some(
      (key) => formData[key] !== initialData[key]
    );
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData(getInitialProductFormData());
    setError(null);
  };

  const handleCloseModal = () => {
    if (isProductFormDirty()) {
      setDiscardConfirmOpen(true);
      return;
    }

    closeModal();
  };

  const handleDiscardProductChanges = () => {
    setDiscardConfirmOpen(false);
    closeModal();
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

  const handleOpenPurchaseDialog = (product: Product) => {
    setPurchaseDialog({ open: true, product });
    setPurchaseForm({
      quantity: '',
      unitOfMeasure: normalizeInventoryUnit(product.unitOfMeasure) || product.unitOfMeasure,
      totalCost: '',
    });
    setPurchaseError(null);
  };

  const handleClosePurchaseDialog = () => {
    setPurchaseDialog({ open: false, product: null });
    setPurchaseForm({
      quantity: '',
      unitOfMeasure: '',
      totalCost: '',
    });
    setPurchaseError(null);
  };

  const handleSaveCategory = async () => {
    const name = categoryForm.trim();
    if (!name) {
      setCategoryError(translatedError('products.categoryNameRequired'));
      return;
    }

    const existingCategory = categories.find(
      (category) => normalizeCategoryKey(category.name) === normalizeCategoryKey(name)
    );
    if (existingCategory && (!editingCategory || existingCategory.id !== editingCategory.id)) {
      setCategoryError(translatedError('products.categoryDuplicate'));
      return;
    }

    try {
      setCategoryError(null);
      let savedCategory: ProductCategory;
      if (editingCategory) {
        savedCategory = await productService.updateCategory(editingCategory.id, name);
        setCategories((currentCategories) =>
          sortProductCategories(
            currentCategories.map((category) =>
              category.id === savedCategory.id ? savedCategory : category
            )
          )
        );
        if (normalizeCategoryKey(formData.category) === normalizeCategoryKey(editingCategory.name)) {
          setFormData({ ...formData, category: savedCategory.name });
        }
      } else {
        savedCategory = await productService.createCategory(name);
        setCategories((currentCategories) =>
          sortProductCategories(
            currentCategories.some(
              (category) =>
                category.id === savedCategory.id ||
                normalizeCategoryKey(category.name) === normalizeCategoryKey(savedCategory.name)
            )
              ? currentCategories.map((category) =>
                  category.id === savedCategory.id ||
                  normalizeCategoryKey(category.name) === normalizeCategoryKey(savedCategory.name)
                    ? savedCategory
                    : category
                )
              : [...currentCategories, savedCategory]
          )
        );
        setFormData({ ...formData, category: savedCategory.name });
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
      setError(null);
      const selectedCategory = formData.category.trim();
      const lowStockThreshold = parseFormNumber(formData.lowStockThreshold);
      const stockLevel = Number(formData.stockLevel);
      const purchaseTotalCost = Number(formData.purchaseTotalCost);
      const unitCost = stockLevel > 0 ? purchaseTotalCost / stockLevel : purchaseTotalCost;
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        stockLevel,
        unitOfMeasure: formData.unitOfMeasure.trim(),
        unitCost,
        lowStockThreshold: lowStockThreshold === null ? undefined : lowStockThreshold,
        category: selectedCategory,
        supplier: formData.supplier.trim() || undefined,
      };

      let savedProduct: Product;
      if (editProduct) {
        savedProduct = await productService.update(editProduct.id, payload);
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === savedProduct.id ? savedProduct : product
          )
        );
      } else {
        savedProduct = await productService.create(payload);
        setProducts((currentProducts) => [savedProduct, ...currentProducts]);
      }

      closeModal();
    } catch (err) {
      setError(toErrorMessage(err, 'products.saveError'));
    }
  };

  const handleRegisterPurchase = async () => {
    const validationError = validatePurchaseForm(purchaseForm, purchaseDialog.product);
    if (validationError) {
      setPurchaseError(validationError);
      return;
    }

    if (!purchaseDialog.product) {
      return;
    }

    try {
      setPurchaseError(null);
      const updatedProduct = await productService.registerPurchase(purchaseDialog.product.id, {
        quantity: Number(purchaseForm.quantity),
        unitOfMeasure: purchaseForm.unitOfMeasure.trim(),
        totalCost: Number(purchaseForm.totalCost),
      });

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product
        )
      );
      handleClosePurchaseDialog();
    } catch (err) {
      setPurchaseError(toErrorMessage(err, 'products.purchaseSaveError'));
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
            {isLowStock(row) && <Warning fontSize="small" color="warning" titleAccess={t('products.lowStockStatus')} />}
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
      render: (row: Product) => {
        const lowStock = isLowStock(row);
        return (
          <Stack spacing={0.75} alignItems="flex-start">
            <Chip
              icon={lowStock ? <Warning fontSize="small" /> : undefined}
              label={`${row.stockLevel} ${row.unitOfMeasure}`}
              color={lowStock ? 'warning' : 'success'}
              size="small"
            />
            {lowStock && (
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                {t('products.lowStockCaption', {
                  threshold: row.lowStockThreshold,
                  unit: row.unitOfMeasure,
                })}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      id: 'unitCost',
      label: t('products.unitCost'),
      render: (row: Product) => formatCurrency(row.unitCost),
    },
    {
      id: 'value',
      label: t('products.totalValue'),
      render: (row: Product) => formatCurrency(row.stockLevel * row.unitCost),
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
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenPurchaseDialog(row)}
            title={t('products.registerPurchase')}
          >
            <AddShoppingCart fontSize="small" />
          </IconButton>
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
  const stockForPreview = parseFormNumber(formData.stockLevel);
  const totalCostForPreview = parseFormNumber(formData.purchaseTotalCost);
  const calculatedUnitCost =
    stockForPreview !== null &&
    totalCostForPreview !== null &&
    !Number.isNaN(stockForPreview) &&
    !Number.isNaN(totalCostForPreview) &&
    stockForPreview > 0
      ? totalCostForPreview / stockForPreview
      : null;
  const purchaseQuantityForPreview = parseFormNumber(purchaseForm.quantity);
  const purchaseCostForPreview = parseFormNumber(purchaseForm.totalCost);
  const purchaseQuantityInProductUnit =
    purchaseDialog.product &&
    purchaseQuantityForPreview !== null &&
    !Number.isNaN(purchaseQuantityForPreview)
      ? convertInventoryQuantity(
          purchaseQuantityForPreview,
          purchaseForm.unitOfMeasure,
          purchaseDialog.product.unitOfMeasure
        )
      : null;
  const purchaseUnitCostPreview =
    purchaseCostForPreview !== null &&
    !Number.isNaN(purchaseCostForPreview) &&
    purchaseQuantityInProductUnit !== null &&
    purchaseQuantityInProductUnit > 0
      ? purchaseCostForPreview / purchaseQuantityInProductUnit
      : null;

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
              inputProps={{ maxLength: MAX_PRODUCT_NAME_LENGTH }}
            />
            <TextField
              label={t('products.description')}
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              inputProps={{ maxLength: MAX_PRODUCT_DESCRIPTION_LENGTH }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('products.stockLevel')}
                type="number"
                fullWidth
                value={formData.stockLevel}
                onChange={(e) => setFormData({ ...formData, stockLevel: e.target.value })}
                required
                helperText={t('products.stockLimitHelp', { limit: PRODUCT_STOCK_LIMIT })}
                InputProps={{
                  inputProps: { min: 0, max: PRODUCT_STOCK_LIMIT, step: 'any' },
                }}
              />
              <TextField
                select
                label={t('products.unitOfMeasure')}
                fullWidth
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                required
                helperText={t('products.unitOfMeasureHelp')}
              >
                {INVENTORY_UNIT_OPTIONS.map((unit) => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label={t('products.purchaseTotalCost')}
              type="number"
              fullWidth
              value={formData.purchaseTotalCost}
              onChange={(e) => setFormData({ ...formData, purchaseTotalCost: e.target.value })}
              required
              helperText={
                calculatedUnitCost === null
                  ? t('products.purchaseTotalCostHelp')
                  : t('products.unitCostPreview', {
                      cost: formatCurrency(calculatedUnitCost),
                      unit: formData.unitOfMeasure || t('products.unit'),
                    })
              }
              InputProps={{
                startAdornment: <InputAdornment position="start">{getDisplayCurrencySymbol()}</InputAdornment>,
                inputProps: { min: 0.01, max: MAX_PRODUCT_COST, step: 'any' },
              }}
            />
            <TextField
              label={t('products.lowStockThreshold')}
              type="number"
              fullWidth
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              helperText={`${t('products.lowStockHelp')} ${t('products.stockLimitHelp', { limit: LOW_STOCK_THRESHOLD_LIMIT })}`}
              InputProps={{
                inputProps: { min: 0, max: LOW_STOCK_THRESHOLD_LIMIT, step: 'any' },
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
                  inputProps={{
                    ...params.inputProps,
                    maxLength: MAX_PRODUCT_CATEGORY_LENGTH,
                  }}
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
              inputProps={{ maxLength: MAX_PRODUCT_SUPPLIER_LENGTH }}
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

      <Dialog open={purchaseDialog.open} onClose={handleClosePurchaseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('products.purchaseTitle', { name: purchaseDialog.product?.name || '' })}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {purchaseErrorMessage && <Alert severity="error">{purchaseErrorMessage}</Alert>}
            <Alert severity="info">{t('products.purchaseHelp')}</Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('products.purchaseQuantity')}
                type="number"
                fullWidth
                value={purchaseForm.quantity}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                required
                InputProps={{
                  inputProps: { min: 0.001, max: PRODUCT_STOCK_LIMIT, step: 'any' },
                }}
              />
              <TextField
                select
                label={t('products.unitOfMeasure')}
                fullWidth
                value={purchaseForm.unitOfMeasure}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, unitOfMeasure: e.target.value })}
                required
              >
                {getCompatibleInventoryUnitOptions(purchaseDialog.product?.unitOfMeasure || '').map((unit) => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label={t('products.purchaseCost')}
              type="number"
              fullWidth
              value={purchaseForm.totalCost}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, totalCost: e.target.value })}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">{getDisplayCurrencySymbol()}</InputAdornment>,
                inputProps: { min: 0.01, max: MAX_PRODUCT_COST, step: 'any' },
              }}
            />
            {purchaseDialog.product && purchaseUnitCostPreview !== null && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {t('products.purchasePreviewTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.purchaseUnitCostPreview', {
                      cost: formatCurrency(purchaseUnitCostPreview),
                      unit: purchaseDialog.product.unitOfMeasure,
                    })}
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleClosePurchaseDialog}>{t('common.cancel')}</Button>
          <Button onClick={() => void handleRegisterPurchase()} variant="contained">
            {t('products.registerPurchase')}
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

      <ConfirmDialog
        open={discardConfirmOpen}
        title={t('common.unsavedChangesTitle')}
        message={t('common.unsavedChangesMessage')}
        confirmText={t('common.discardChanges')}
        cancelText={t('common.keepEditing')}
        onConfirm={handleDiscardProductChanges}
        onCancel={() => setDiscardConfirmOpen(false)}
      />
    </Box>
  );
}
