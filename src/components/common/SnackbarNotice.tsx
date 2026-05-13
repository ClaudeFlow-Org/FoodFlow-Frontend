import { Alert, Snackbar } from '@mui/material';

interface SnackbarNoticeProps {
  open: boolean;
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
  autoHideDuration?: number;
}

export function SnackbarNotice({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 3000,
}: SnackbarNoticeProps) {
  return (
    <Snackbar open={open} onClose={onClose} autoHideDuration={autoHideDuration}>
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
