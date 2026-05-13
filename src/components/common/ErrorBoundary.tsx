import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { useI18n } from '@/i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
  reloadLabel?: string;
  tryAgainLabel?: string;
  supportText?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors
 * Prevents the entire app from crashing and provides a recovery option
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 2,
          }}
        >
          <Container maxWidth="md">
            <Paper
              sx={{
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              <Stack spacing={3} alignItems="center">
                {/* Error Icon */}
                <ErrorOutline
                  sx={{
                    fontSize: 64,
                    color: 'error.main',
                  }}
                />

                {/* Error Title */}
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {this.props.title || 'No pudimos mostrar esta pantalla'}
                </Typography>

                {/* Error Message */}
                <Typography variant="body1" color="text.secondary">
                  {this.props.message || 'Algo falló al cargar la vista. Recarga la página o vuelve a intentarlo.'}
                </Typography>

                {/* Additional Info */}
                {import.meta.env.DEV && this.state.error && (
                  <Box
                    sx={{
                      width: '100%',
                      bgcolor: 'error.contrastText',
                      p: 2,
                      borderRadius: 1,
                      textAlign: 'left',
                      overflow: 'auto',
                      maxHeight: 200,
                    }}
                  >
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </Typography>
                  </Box>
                )}

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={this.handleReload}
                    size="large"
                  >
                    {this.props.reloadLabel || 'Recargar página'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={this.handleReset}
                    size="large"
                  >
                    {this.props.tryAgainLabel || 'Intentar de nuevo'}
                  </Button>
                </Stack>

                {/* Support Text */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {this.props.supportText || 'Si el problema continúa, vuelve a intentar más tarde.'}
                </Typography>
              </Stack>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export function LocalizedErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <ErrorBoundary
      title={t('errorBoundary.title')}
      message={t('errorBoundary.message')}
      reloadLabel={t('errorBoundary.reload')}
      tryAgainLabel={t('errorBoundary.tryAgain')}
      supportText={t('errorBoundary.support')}
    >
      {children}
    </ErrorBoundary>
  );
}
