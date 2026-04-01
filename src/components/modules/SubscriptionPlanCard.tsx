import { Paper, Stack, Typography, Button, Box, Chip } from '@mui/material';
import { CheckCircle, Star } from '@mui/icons-material';
import type { SubscriptionPlan } from '@/types';
import { formatCurrency } from '@/utils';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelect?: () => void;
}

export function SubscriptionPlanCard({ plan, isCurrentPlan = false, onSelect }: SubscriptionPlanCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
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
          label="Current Plan"
          color="primary"
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12 }}
        />
      )}

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star color={plan.type === 'ENTERPRISE' ? 'primary' : 'disabled'} />
          <Typography variant="h5">{plan.name}</Typography>
        </Box>
        <Typography variant="h4" color="primary.main">
          {formatCurrency(plan.price)}
          <Typography variant="body2" color="text.secondary">
            /{plan.interval.toLowerCase()}
          </Typography>
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ flex: 1 }}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Features
          </Typography>
          <Stack spacing={1}>
            {plan.features.map((feature, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                <CheckCircle sx={{ fontSize: 16, color: 'success.main', mt: 0.25 }} />
                <Typography variant="body2">{feature}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Limits
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              • Up to {plan.maxDishes} dishes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Up to {plan.maxProducts} products
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Up to {plan.maxOrdersPerMonth} orders/month
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
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </Button>
      </Box>
    </Paper>
  );
}
