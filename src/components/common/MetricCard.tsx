import { Card, CardContent, Typography, Box, SxProps } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'success' | 'error' | 'info' | 'warning';
  sx?: SxProps;
}

export function MetricCard({ title, value, subtitle, trend, color = 'info', sx }: MetricCardProps) {
  const theme = useTheme();
  const colors = {
    main: theme.palette[color].main,
    light: alpha(theme.palette[color].main, theme.palette.mode === 'dark' ? 0.18 : 0.12),
  };
  const isPositive = trend && trend.value >= 0;

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 152,
        bgcolor: colors.light,
        borderLeft: `4px solid ${colors.main}`,
        overflow: 'hidden',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '0 0 auto auto',
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: alpha(colors.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
          transform: 'translate(35%, -35%)',
          pointerEvents: 'none',
        },
        ...sx,
      }}
    >
      <CardContent sx={{ height: '100%', p: { xs: 2.25, sm: 2.5 }, position: 'relative', zIndex: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography
          variant="h4"
          component="div"
          sx={{ color: colors.main, mb: 1, fontWeight: 850, lineHeight: 1.08 }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.25, flexWrap: 'wrap', gap: 0.5 }}>
            {isPositive ? (
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography
              variant="caption"
              color={isPositive ? 'success.main' : 'error.main'}
              sx={{ fontWeight: 'medium' }}
            >
              {isPositive ? '+' : ''}
              {trend.value}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
