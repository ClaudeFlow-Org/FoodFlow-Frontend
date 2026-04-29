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
        bgcolor: colors.light,
        borderLeft: `4px solid ${colors.main}`,
        ...sx,
      }}
    >
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ color: colors.main, mb: 1, fontWeight: 'bold' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {isPositive ? (
              <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
            )}
            <Typography
              variant="caption"
              color={isPositive ? 'success.main' : 'error.main'}
              sx={{ fontWeight: 'medium' }}
            >
              {isPositive ? '+' : ''}
              {trend.value}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
