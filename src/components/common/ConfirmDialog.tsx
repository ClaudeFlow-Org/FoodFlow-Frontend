import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useI18n } from '@/i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'info' | 'warning' | 'error';
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  severity = 'warning',
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const color = severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'primary';

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onCancel} color="inherit">
          {cancelText || t('common.cancel')}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={color}>
          {confirmText || t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
