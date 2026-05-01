import { Paper, Stack, Typography, Button, Box, Chip } from '@mui/material';
import { CheckCircle, Star } from '@mui/icons-material';
import type { SubscriptionPlan } from '@/types';
import { formatCurrency } from '@/utils';
import { useI18n } from '@/i18n';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelect?: () => void;
}

export function SubscriptionPlanCard({ plan, isCurrentPlan = false, onSelect }: SubscriptionPlanCardProps) {
  const { t } = useI18n();
  const planName = t(`plans.${plan.type}.name`);
  const formatLimit = (value: number) =>
    value === Number.MAX_SAFE_INTEGER ? t('common.unlimited') : value;
  const featureLabel = (feature: string, index: number) => {
    const key = `plans.${plan.type}.feature.${index}`;
    const translated = t(key);
    return translated === key ? feature : translated;
  };

  return (
    <Paper
      sx={{
        p: { xs: 2.5, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isCurrentPlan ? 2 : 1,
        borderColor: isCurrentPlan ? 'primary.main' : 'divider',
        position: 'relative',
      }}
    >
      {isCurrentPlan && (
        <Chip
          label={t('common.currentPlan')}
          color="primary"
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12 }}
        />
      )}

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star color={plan.type === 'PREMIUM' ? 'primary' : 'disabled'} />
          <Typography variant="h5" sx={{ fontWeight: 850 }}>{planName}</Typography>
        </Box>
        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 850 }}>
          {formatCurrency(plan.price)}
          <Typography variant="body2" color="text.secondary">
            /{t('settings.monthly')}
          </Typography>
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ flex: 1 }}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('subscription.features')}
          </Typography>
          <Stack spacing={1}>
            {plan.features.map((feature, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                <CheckCircle sx={{ fontSize: 16, color: 'success.main', mt: 0.25 }} />
                <Typography variant="body2">{featureLabel(feature, index)}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('subscription.limits')}
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              - {t('subscription.maxDishes', { count: formatLimit(plan.maxDishes) })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - {t('subscription.maxProducts', { count: formatLimit(plan.maxProducts) })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - {t('subscription.maxOrders', { count: formatLimit(plan.maxOrdersPerMonth) })}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Button
          variant={isCurrentPlan ? 'outlined' : 'contained'}
          fullWidth
          onClick={onSelect}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? t('common.currentPlan') : t('common.selectPlan')}
        </Button>
      </Box>
    </Paper>
  );
}
