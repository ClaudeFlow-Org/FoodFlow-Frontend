import { Alert, AlertTitle, SxProps } from '@mui/material';
import { CloseIconButton } from './CloseIconButton';

interface ErrorAlertProps {
  message: string;
  title?: string;
  onClose?: () => void;
  sx?: SxProps;
}

export function ErrorAlert({ message, title, onClose, sx }: ErrorAlertProps) {
  return (
    <Alert severity="error" sx={{ mb: 2, ...sx }} action={onClose && <CloseIconButton onClose={onClose} />}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
    </Alert>
  );
}
