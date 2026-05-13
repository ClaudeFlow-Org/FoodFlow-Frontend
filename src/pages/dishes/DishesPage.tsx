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
  Stack,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader, ConfirmDialog, DataTable, EmptyState, SnackbarNotice } from '@/components/common';
import { dishService } from '@/services';
import type { Dish, Column } from '@/types';
import { Restaurant } from '@mui/icons-material';
import { useI18n } from '@/i18n';
import { createDishSchema } from '@/validation/schemas';
import { useRevalidateOnLanguageChange } from '@/hooks';

export default function DishesPage() {
  const { t, language } = useI18n();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editDish, setEditDish] = useState<Dish | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; dish: Dish | null }>({
    open: false,
    dish: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const dishSchema = useMemo(() => createDishSchema(t), [t]);
  type DishFormData = z.infer<ReturnType<typeof createDishSchema>>;

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<DishFormData>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      name: '',
      description: '',
      price: undefined,
      ingredients: '',
    },
  });

  useRevalidateOnLanguageChange(trigger, language);

  useEffect(() => {
    void loadDishes();
  }, []);

  const loadDishes = async () => {
    try {
      setLoading(true);
      const data = await dishService.getAll();
      setDishes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dishes.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dish?: Dish) => {
    if (dish) {
      setEditDish(dish);
      reset({
        name: dish.name,
        description: dish.description || '',
        price: dish.price,
        ingredients: dish.ingredients,
      });
    } else {
      setEditDish(null);
      reset({
        name: '',
        description: '',
        price: undefined,
        ingredients: '',
      });
    }
    setOpenModal(true);
    setSubmitError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditDish(null);
  };

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        ingredients: data.ingredients || '',
      };

      if (editDish) {
        await dishService.update(editDish.id, payload);
        setSuccessMessage(t('notifications.dishes.updated'));
      } else {
        await dishService.create(payload);
        setSuccessMessage(t('notifications.dishes.created'));
      }

      handleCloseModal();
      void loadDishes();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('dishes.saveError'));
    }
  });

  const handleDelete = async () => {
    if (deleteConfirm.dish) {
      try {
        await dishService.delete(deleteConfirm.dish.id);
        setDeleteConfirm({ open: false, dish: null });
        setSuccessMessage(t('notifications.dishes.deleted'));
        void loadDishes();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('dishes.deleteError'));
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
      render: (row: Dish) => `$${row.price.toFixed(2)}`,
    },
    {
      id: 'ingredients',
      label: t('dishes.ingredients'),
      render: (row: Dish) => (
        <Box>{row.ingredients}</Box>
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
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
          >
            {t('dishes.add')}
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
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
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editDish ? t('dishes.editTitle') : t('dishes.addTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <TextField
              {...register('name')}
              label={t('dishes.name')}
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              {...register('description')}
              label={t('dishes.description')}
              fullWidth
              multiline
              rows={2}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <TextField
              {...register('price', { valueAsNumber: true })}
              label={t('dishes.price')}
              type="number"
              fullWidth
              error={!!errors.price}
              helperText={errors.price?.message}
              InputProps={{ startAdornment: '$' }}
              inputProps={{ min: 0.01, max: 99999999.99, step: 0.01 }}
            />
            <TextField
              {...register('ingredients')}
              label={t('dishes.ingredients')}
              fullWidth
              multiline
              rows={2}
              placeholder={t('dishes.ingredientsPlaceholder')}
              error={!!errors.ingredients}
              helperText={errors.ingredients?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleCloseModal}>{t('common.cancel')}</Button>
          <Button onClick={() => void onSubmit()} variant="contained" disabled={isSubmitting}>
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

      <SnackbarNotice
        open={Boolean(successMessage)}
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
    </Box>
  );
}
