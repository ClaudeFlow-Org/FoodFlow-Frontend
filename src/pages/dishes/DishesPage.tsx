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
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { PageHeader, ConfirmDialog, DataTable, EmptyState } from '@/components/common';
import { dishService } from '@/services';
import type { Dish, Column } from '@/types';
import { Restaurant } from '@mui/icons-material';
import { useI18n } from '@/i18n';

export default function DishesPage() {
  const { t } = useI18n();
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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    ingredients: '',
  });

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
      setFormData({
        name: dish.name,
        description: dish.description || '',
        price: dish.price.toString(),
        ingredients: dish.ingredients,
      });
    } else {
      setEditDish(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        ingredients: '',
      });
    }
    setOpenModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditDish(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        ingredients: formData.ingredients,
      };

      if (editDish) {
        await dishService.update(editDish.id, payload);
      } else {
        await dishService.create(payload);
      }

      handleCloseModal();
      void loadDishes();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dishes.saveError'));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.dish) {
      try {
        await dishService.delete(deleteConfirm.dish.id);
        setDeleteConfirm({ open: false, dish: null });
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder={t('dishes.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ width: 300 }}
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
            {error && <Alert severity="error">{error}</Alert>}
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
              InputProps={{ startAdornment: '$' }}
            />
            <TextField
              label={t('dishes.ingredients')}
              fullWidth
              multiline
              rows={2}
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder={t('dishes.ingredientsPlaceholder')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
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
