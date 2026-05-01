import { Box, Typography, SxProps } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  sx?: SxProps;
}

export function EmptyState({ icon, title, description, action, sx }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 280,
        py: { xs: 6, sm: 8 },
        px: 3,
        textAlign: 'center',
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: 2,
            width: 72,
            height: 72,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            color: 'text.disabled',
            boxShadow: 1,
            '& svg': { fontSize: 40 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
