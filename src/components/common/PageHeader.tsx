import { Box, Typography, Stack, SxProps } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  sx?: SxProps;
}

export function PageHeader({ title, subtitle, action, sx }: PageHeaderProps) {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 }, ...sx }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2.5}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ color: 'text.primary', fontSize: { xs: '1.8rem', sm: '2.125rem' }, lineHeight: 1.12 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: 'flex-start' }}>{action}</Box>}
      </Stack>
    </Box>
  );
}
