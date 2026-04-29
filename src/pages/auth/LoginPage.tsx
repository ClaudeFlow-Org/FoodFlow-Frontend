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

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
        password: z
          .string()
          .min(1, t('auth.validation.passwordRequired'))
          .min(6, t('auth.validation.passwordMin')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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
        px: 2,
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
        <AppControls compact />
      </Box>
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 4,
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            {t('app.name')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : t('common.signIn')}
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
