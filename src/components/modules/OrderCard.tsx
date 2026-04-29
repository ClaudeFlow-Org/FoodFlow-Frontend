import { Card, CardContent, Typography, Chip, Box, Stack, Divider, SxProps } from '@mui/material';
import { Receipt } from '@mui/icons-material';
import type { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils';
import { useI18n } from '@/i18n';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  sx?: SxProps;
}

const statusColors: Record<Order['status'], 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  PENDING: 'default',
  PREPARING: 'info',
  READY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

export function OrderCard({ order, onClick, sx }: OrderCardProps) {
  const { t } = useI18n();

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        ...sx,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt fontSize="small" color="action" />
            <Typography variant="h6">
              #{order.orderNumber.slice(-6)}
            </Typography>
          </Box>
          <Chip label={t(`orders.status.${order.status}`)} color={statusColors[order.status]} size="small" />
        </Box>

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {t('orders.table')}
            </Typography>
            <Typography variant="body2">
              {order.customerName || t('orders.walkIn')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {t('orders.type')}
            </Typography>
            <Typography variant="body2">
              {t(`orders.type.${order.orderType}`)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {t('orders.items')}
            </Typography>
            <Typography variant="body2">
              {t('orders.itemsCount', { count: order.lineItems.length })}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('orders.total')}
            </Typography>
            <Typography variant="h6" color="primary.main">
              {formatCurrency(order.totalAmount)}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {formatDateTime(order.createdAt)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
