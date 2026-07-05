import { IconButton, InputAdornment, Tooltip } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useI18n } from '@/i18n';

interface PasswordVisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PasswordVisibilityToggle({
  visible,
  onToggle,
  disabled = false,
}: PasswordVisibilityToggleProps) {
  const { t } = useI18n();
  const label = visible ? t('common.hidePassword') : t('common.showPassword');

  return (
    <InputAdornment position="end">
      <Tooltip title={label}>
        <span>
          <IconButton
            aria-label={label}
            edge="end"
            onClick={onToggle}
            disabled={disabled}
          >
            {visible ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </span>
      </Tooltip>
    </InputAdornment>
  );
}
