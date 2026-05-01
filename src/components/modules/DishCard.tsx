import { Card, CardContent, Typography, Box, SxProps } from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import type { Dish } from '@/types';
import { useI18n } from '@/i18n';

interface DishCardProps {
  dish: Dish;
  onClick?: () => void;
  sx?: SxProps;
}

export function DishCard({ dish, onClick, sx }: DishCardProps) {
  const { t } = useI18n();

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-3px)',
          boxShadow: 4,
        } : {},
        ...sx,
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2.25, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
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
            <Typography variant="h6" noWrap sx={{ fontWeight: 800 }}>
              {dish.name}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 850 }}>
              ${dish.price.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        {dish.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {dish.description}
          </Typography>
        )}
        {dish.ingredients && dish.ingredients.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('dishes.ingredientsLabel', { ingredients: dish.ingredients })}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
