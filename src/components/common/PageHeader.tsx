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
    <Box sx={{ mb: 4, ...sx }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Stack>
    </Box>
  );
}
