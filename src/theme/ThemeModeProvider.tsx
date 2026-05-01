import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { alpha, createTheme, CssBaseline, ThemeProvider } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);
const STORAGE_KEY = 'foodflow-theme-mode';

const brand = {
  cream: '#faf8f5',
  sand: '#f5f0e8',
  warmWhite: '#fff9f3',
  ink: '#1a1612',
  muted: '#6b5f52',
  orange: '#f2811d',
  orangeBright: '#ff833a',
  terracotta: '#c45c3e',
  espresso: '#2d2620',
};

const getInitialMode = (): ThemeMode => {
  const savedMode = localStorage.getItem(STORAGE_KEY);
  return savedMode === 'dark' ? 'dark' : 'light';
};

const buildTheme = (mode: ThemeMode) => {
  const isDark = mode === 'dark';
  const backgroundDefault = isDark ? brand.ink : brand.cream;
  const backgroundPaper = isDark ? '#241f1a' : '#ffffff';
  const textPrimary = isDark ? brand.warmWhite : brand.ink;
  const textSecondary = isDark ? '#d2c4b5' : brand.muted;
  const divider = isDark ? 'rgba(255, 249, 243, 0.12)' : 'rgba(45, 38, 32, 0.10)';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brand.orange,
        light: brand.orangeBright,
        dark: '#bd5f12',
        contrastText: '#fffaf4',
      },
      secondary: {
        main: brand.terracotta,
        light: '#df7d62',
        dark: '#93432f',
        contrastText: '#fffaf4',
      },
      success: {
        main: brand.terracotta,
        light: '#df7d62',
        dark: '#93432f',
        contrastText: '#fffaf4',
      },
      info: {
        main: isDark ? '#f5d0aa' : brand.espresso,
        light: isDark ? '#fff0dc' : '#51443a',
        dark: isDark ? '#d5a16f' : brand.ink,
        contrastText: isDark ? brand.ink : '#fffaf4',
      },
      warning: {
        main: brand.orangeBright,
        light: '#ffb176',
        dark: '#b95d1a',
        contrastText: brand.ink,
      },
      error: {
        main: '#a94635',
        light: '#d46b54',
        dark: '#7d2f24',
        contrastText: '#fffaf4',
      },
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
      },
      divider,
    },
    typography: {
      fontFamily: '"DM Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontFamily: '"Inter", "DM Sans", sans-serif', fontWeight: 800, letterSpacing: 0 },
      h2: { fontFamily: '"Inter", "DM Sans", sans-serif', fontWeight: 800, letterSpacing: 0 },
      h3: { fontFamily: '"Inter", "DM Sans", sans-serif', fontWeight: 800, letterSpacing: 0 },
      h4: { fontFamily: '"Inter", "DM Sans", sans-serif', fontWeight: 800, letterSpacing: 0 },
      h5: { fontFamily: '"Inter", "DM Sans", sans-serif', fontWeight: 750, letterSpacing: 0 },
      h6: { fontFamily: '"Inter", "DM Sans", sans-serif', fontWeight: 700, letterSpacing: 0 },
      button: { fontWeight: 700, letterSpacing: 0, textTransform: 'none' },
      body1: { letterSpacing: 0 },
      body2: { letterSpacing: 0 },
    },
    shape: {
      borderRadius: 18,
    },
    shadows: [
      'none',
      `0 1px 2px ${alpha(brand.ink, isDark ? 0.24 : 0.06)}`,
      `0 8px 24px ${alpha(brand.ink, isDark ? 0.26 : 0.08)}`,
      `0 12px 32px ${alpha(brand.ink, isDark ? 0.30 : 0.10)}`,
      `0 18px 44px ${alpha(brand.ink, isDark ? 0.34 : 0.12)}`,
      `0 24px 60px ${alpha(brand.ink, isDark ? 0.38 : 0.14)}`,
      `0 28px 68px ${alpha(brand.ink, isDark ? 0.40 : 0.16)}`,
      `0 32px 76px ${alpha(brand.ink, isDark ? 0.42 : 0.18)}`,
      `0 36px 84px ${alpha(brand.ink, isDark ? 0.44 : 0.20)}`,
      `0 40px 92px ${alpha(brand.ink, isDark ? 0.46 : 0.22)}`,
      `0 44px 100px ${alpha(brand.ink, isDark ? 0.48 : 0.24)}`,
      `0 48px 108px ${alpha(brand.ink, isDark ? 0.50 : 0.26)}`,
      `0 52px 116px ${alpha(brand.ink, isDark ? 0.52 : 0.28)}`,
      `0 56px 124px ${alpha(brand.ink, isDark ? 0.54 : 0.30)}`,
      `0 60px 132px ${alpha(brand.ink, isDark ? 0.56 : 0.32)}`,
      `0 64px 140px ${alpha(brand.ink, isDark ? 0.58 : 0.34)}`,
      `0 68px 148px ${alpha(brand.ink, isDark ? 0.60 : 0.36)}`,
      `0 72px 156px ${alpha(brand.ink, isDark ? 0.62 : 0.38)}`,
      `0 76px 164px ${alpha(brand.ink, isDark ? 0.64 : 0.40)}`,
      `0 80px 172px ${alpha(brand.ink, isDark ? 0.66 : 0.42)}`,
      `0 84px 180px ${alpha(brand.ink, isDark ? 0.68 : 0.44)}`,
      `0 88px 188px ${alpha(brand.ink, isDark ? 0.70 : 0.46)}`,
      `0 92px 196px ${alpha(brand.ink, isDark ? 0.72 : 0.48)}`,
      `0 96px 204px ${alpha(brand.ink, isDark ? 0.74 : 0.50)}`,
      `0 100px 212px ${alpha(brand.ink, isDark ? 0.76 : 0.52)}`,
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background:
              mode === 'dark'
                ? `linear-gradient(180deg, ${brand.ink} 0%, #211b16 100%)`
                : `linear-gradient(180deg, ${brand.cream} 0%, ${brand.warmWhite} 100%)`,
            overflowX: 'hidden',
          },
          '::selection': {
            backgroundColor: alpha(brand.orange, 0.24),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? alpha(brand.espresso, 0.92) : alpha('#ffffff', 0.86),
            color: textPrimary,
            borderBottom: `1px solid ${divider}`,
            boxShadow: `0 8px 24px ${alpha(brand.ink, isDark ? 0.24 : 0.06)}`,
            backdropFilter: 'blur(14px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: isDark ? '#201a15' : '#fffdf9',
            borderRight: `1px solid ${divider}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${divider}`,
            boxShadow: `0 18px 50px ${alpha(brand.ink, isDark ? 0.22 : 0.07)}`,
            backgroundClip: 'padding-box',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 22,
            border: `1px solid ${divider}`,
            boxShadow: `0 18px 50px ${alpha(brand.ink, isDark ? 0.22 : 0.07)}`,
            backgroundImage: isDark
              ? `linear-gradient(180deg, ${alpha('#ffffff', 0.045)} 0%, ${alpha('#ffffff', 0.018)} 100%)`
              : `linear-gradient(180deg, #ffffff 0%, ${brand.warmWhite} 100%)`,
            transition: 'box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 18,
            minHeight: 40,
            gap: 6,
          },
          containedPrimary: {
            boxShadow: `0 12px 24px ${alpha(brand.orange, isDark ? 0.22 : 0.18)}`,
            '&:hover': {
              backgroundColor: brand.orangeBright,
              boxShadow: `0 16px 32px ${alpha(brand.orange, isDark ? 0.28 : 0.24)}`,
            },
          },
          outlined: {
            borderColor: alpha(brand.orange, isDark ? 0.36 : 0.28),
            '&:hover': {
              borderColor: brand.orange,
              backgroundColor: alpha(brand.orange, isDark ? 0.12 : 0.08),
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            transition: 'background-color 160ms ease, color 160ms ease',
            '&:hover': {
              backgroundColor: alpha(brand.orange, isDark ? 0.14 : 0.08),
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: isDark ? alpha('#ffffff', 0.04) : '#fffdf9',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(brand.orange, 0.56),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.orange,
              borderWidth: 2,
            },
          },
          notchedOutline: {
            borderColor: divider,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            alignItems: 'center',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            overflow: 'hidden',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha('#ffffff', 0.04) : brand.sand,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: divider,
            paddingBlock: 14,
          },
          head: {
            color: textSecondary,
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.MuiTableRow-hover:hover': {
              backgroundColor: alpha(brand.orange, isDark ? 0.10 : 0.06),
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: '24px 24px 8px',
            fontWeight: 800,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '16px 24px 8px',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '16px 24px 24px',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 44,
            fontWeight: 800,
            textTransform: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            marginInline: 10,
            marginBlock: 3,
            '&.Mui-selected': {
              backgroundColor: alpha(brand.orange, isDark ? 0.18 : 0.12),
              color: brand.orange,
              '& .MuiListItemIcon-root': {
                color: brand.orange,
              },
            },
            '&.Mui-selected:hover': {
              backgroundColor: alpha(brand.orange, isDark ? 0.24 : 0.16),
            },
          },
        },
      },
    },
  });
};

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((currentMode) => (currentMode === 'light' ? 'dark' : 'light')),
    }),
    [mode]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }

  return context;
}
