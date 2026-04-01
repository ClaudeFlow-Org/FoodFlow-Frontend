import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  children: ReactNode;
}

export function LoadingButton({ loading = false, children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button {...props} disabled={disabled || loading}>
      {loading ? <CircularProgress size={24} color="inherit" /> : children}
    </Button>
  );
}
