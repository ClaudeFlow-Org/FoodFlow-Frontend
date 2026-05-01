import { Box, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useI18n, type Language } from '@/i18n';
import { useThemeMode } from '@/theme';

interface AppControlsProps {
  compact?: boolean;
}

const languageOptions: Record<Language, { flag: string; shortKey: string; labelKey: string }> = {
  es: { flag: '🇪🇸', shortKey: 'language.esShort', labelKey: 'language.es' },
  en: { flag: '🇬🇧', shortKey: 'language.enShort', labelKey: 'language.en' },
};

export function AppControls({ compact = false }: AppControlsProps) {
  const { language, setLanguage, t } = useI18n();
  const { mode, toggleMode } = useThemeMode();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.75 : 1.25 }}>
      <ButtonGroup
        size="small"
        variant="outlined"
        sx={{
          '& .MuiButton-root': {
            minWidth: compact ? 48 : 58,
            px: compact ? 0.85 : 1.2,
          },
        }}
      >
        {(['es', 'en'] as Language[]).map((item) => (
          <Button
            key={item}
            variant={language === item ? 'contained' : 'outlined'}
            onClick={() => setLanguage(item)}
            aria-label={t(languageOptions[item].labelKey)}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{ display: 'inline-flex', fontSize: compact ? 15 : 16, lineHeight: 1 }}
            >
              {languageOptions[item].flag}
            </Box>
            <Box component="span">{t(languageOptions[item].shortKey)}</Box>
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
