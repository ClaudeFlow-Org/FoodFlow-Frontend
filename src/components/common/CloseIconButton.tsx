import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface CloseIconButtonProps {
  onClose: () => void;
}

export function CloseIconButton({ onClose }: CloseIconButtonProps) {
  return (
    <IconButton
      aria-label="close"
      color="inherit"
      size="small"
      onClick={onClose}
    >
      <Close fontSize="small" />
    </IconButton>
  );
}
