import { Box, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useI18n, type Language } from '@/i18n';
import { useThemeMode } from '@/theme';

interface AppControlsProps {
  compact?: boolean;
}

export function AppControls({ compact = false }: AppControlsProps) {
  const { language, setLanguage, t } = useI18n();
  const { mode, toggleMode } = useThemeMode();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 1 : 1.5 }}>
      <ButtonGroup size="small" variant="outlined">
        {(['es', 'en'] as Language[]).map((item) => (
          <Button
            key={item}
            variant={language === item ? 'contained' : 'outlined'}
            onClick={() => setLanguage(item)}
          >
            {t(`language.${item}Short`)}
          </Button>
        ))}
      </ButtonGroup>
      <Tooltip title={mode === 'light' ? t('theme.dark') : t('theme.light')}>
        <IconButton color="inherit" onClick={toggleMode} size={compact ? 'small' : 'medium'}>
          {mode === 'light' ? <DarkMode /> : <LightMode />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
