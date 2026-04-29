import { Card, CardContent, Typography, Box, SxProps } from '@mui/material';
import { Inventory2Outlined, Warning } from '@mui/icons-material';
import type { Product } from '@/types';
import { formatCurrency, isLowStock } from '@/utils';
import { useI18n } from '@/i18n';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  sx?: SxProps;
}

export function ProductCard({ product, onClick, sx }: ProductCardProps) {
  const { t } = useI18n();
  const lowStock = isLowStock(product.stockLevel, product.lowStockThreshold);
  const totalValue = product.stockLevel * product.unitCost;

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        borderLeft: lowStock ? '4px solid' : '4px solid transparent',
        borderColor: lowStock ? 'warning.main' : 'transparent',
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
              bgcolor: lowStock ? 'warning.main' : 'info.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'common.white',
            }}
          >
            {lowStock ? <Warning /> : <Inventory2Outlined />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {product.name}
            </Typography>
            {product.category && (
              <Typography variant="caption" color="text.secondary">
                {product.category}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('products.stockLevel')}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {product.stockLevel} {product.unitOfMeasure}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('products.unitCost')}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(product.unitCost)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('products.totalValue')}
            </Typography>
            <Typography variant="body1" fontWeight="medium" color="primary.main">
              {formatCurrency(totalValue)}
            </Typography>
          </Box>
        </Box>
        {lowStock && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
            {t('products.lowStockCaption', {
              threshold: product.lowStockThreshold,
              unit: product.unitOfMeasure,
            })}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
