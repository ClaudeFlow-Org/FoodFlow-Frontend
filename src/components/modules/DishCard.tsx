import { Card, CardContent, Typography, Chip, Box, SxProps } from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import type { Dish } from '@/types';

interface DishCardProps {
  dish: Dish;
  onClick?: () => void;
  sx?: SxProps;
}

export function DishCard({ dish, onClick, sx }: DishCardProps) {
  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        opacity: dish.available ? 1 : 0.6,
        ...sx,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
            }}
          >
            <Restaurant />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {dish.name}
            </Typography>
            {dish.category && (
              <Chip label={dish.category} size="small" sx={{ mt: 0.5 }} />
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary.main">
              ${dish.price.toFixed(2)}
            </Typography>
            <Chip
              label={dish.available ? 'Available' : 'Unavailable'}
              color={dish.available ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>
        {dish.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {dish.description}
          </Typography>
        )}
        {dish.ingredients.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Ingredients:{' '}
              {dish.ingredients.slice(0, 3).join(', ')}
              {dish.ingredients.length > 3 && ` +${dish.ingredients.length - 3} more`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
