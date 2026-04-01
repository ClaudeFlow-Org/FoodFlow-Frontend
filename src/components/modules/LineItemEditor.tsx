import {
  Box,
  Paper,
  IconButton,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { Dish } from '@/types';
import { formatCurrency } from '@/utils';

interface LineItem {
  dishId: number;
  quantity: number;
  unitPrice: number;
  dishName: string;
}

interface LineItemEditorProps {
  items: LineItem[];
  availableDishes: Dish[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
}

export function LineItemEditor({ items, availableDishes, onChange, disabled }: LineItemEditorProps) {
  const addItem = () => {
    onChange([
      ...items,
      { dishId: 0, quantity: 1, unitPrice: 0, dishName: '' },
    ]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    if (field === 'dishId') {
      const dish = availableDishes.find((d) => d.id === value);
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
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  return (
    <Stack spacing={2}>
      {items.map((item, index) => (
        <Paper key={index} sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl sx={{ flexGrow: 1 }} disabled={disabled}>
              <InputLabel>Dish</InputLabel>
              <Select
                value={item.dishId}
                label="Dish"
                onChange={(e) => updateItem(index, 'dishId', e.target.value)}
              >
                {availableDishes.map((dish) => (
                  <MenuItem key={dish.id} value={dish.id}>
                    {dish.name} - {formatCurrency(dish.price)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Quantity"
              type="number"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
              InputProps={{
                inputProps: { min: 1 },
              }}
              sx={{ width: 100 }}
              disabled={disabled}
            />

            <Typography variant="body2" sx={{ minWidth: 80 }}>
              {formatCurrency(item.unitPrice)}
            </Typography>

            <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 80 }}>
              {formatCurrency(item.unitPrice * item.quantity)}
            </Typography>

            <IconButton
              color="error"
              onClick={() => removeItem(index)}
              disabled={disabled || items.length === 1}
            >
              <Delete />
            </IconButton>
          </Stack>
        </Paper>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Total: {formatCurrency(getTotal())}</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <IconButton
          onClick={addItem}
          disabled={disabled || availableDishes.length === 0}
          color="primary"
          sx={{ border: '1px dashed', borderColor: 'divider' }}
        >
          <Add />
          <Typography variant="button" sx={{ ml: 1 }}>
            Add Item
          </Typography>
        </IconButton>
      </Box>
    </Stack>
  );
}
