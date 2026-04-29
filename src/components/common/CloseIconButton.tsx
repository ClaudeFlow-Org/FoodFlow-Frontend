import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useI18n } from '@/i18n';

interface CloseIconButtonProps {
  onClose: () => void;
}

export function CloseIconButton({ onClose }: CloseIconButtonProps) {
  const { t } = useI18n();

  return (
    <IconButton
      aria-label={t('common.close')}
      color="inherit"
      size="small"
      onClick={onClose}
    >
      <Close fontSize="small" />
    </IconButton>
  );
}
