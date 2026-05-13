import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/i18n';
import { AppControls } from '@/components/common';
import { createLoginSchema } from '@/validation/schemas';
import { useRevalidateOnLanguageChange } from '@/hooks';

const brandLogoSrc = '/foodflow-mark.png';

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t, language } = useI18n();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useRevalidateOnLanguageChange(trigger, language);

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    clearError();

    try {
      await login(data);
      void navigate('/dashboard');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('auth.login.failed'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3 },
        py: 6,
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 } }}>
        <AppControls compact />
      </Box>
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: 460,
            p: { xs: 3, sm: 4.5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src={brandLogoSrc}
            alt=""
            sx={{ width: 58, height: 58, objectFit: 'contain', mb: 1.5 }}
          />
          <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 850, textAlign: 'center' }}>
            {t('app.name')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {t('auth.login.subtitle')}
          </Typography>

          {(error || submitError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error || submitError}
            </Alert>
          )}

          <Box component="form" onSubmit={(event) => void handleSubmit(onSubmit)(event)} sx={{ width: '100%' }}>
            <TextField
              {...register('email')}
              label={t('auth.fields.email')}
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />

            <TextField
              {...register('password')}
              label={t('auth.fields.password')}
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isLoading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2, minHeight: 48 }}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
              {isLoading ? t('auth.loggingIn') : t('common.signIn')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                {t('auth.login.noAccount')}{' '}
                <MuiLink component={Link} to="/register" underline="hover">
                  {t('common.signUp')}
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
