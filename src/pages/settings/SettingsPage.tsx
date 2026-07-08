import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Alert,
  Tabs,
  Tab,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Grid,
  LinearProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { PageHeader, PasswordVisibilityToggle } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { authService, subscriptionService } from '@/services';
import type { SubscriptionPlan, UserSubscription } from '@/types';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Star from '@mui/icons-material/Star';
import { useI18n } from '@/i18n';
import {
  DISPLAY_CURRENCY_OPTIONS,
  formatCurrency,
  getDisplayCurrency,
  setDisplayCurrency,
  type DisplayCurrency,
} from '@/utils';
import {
  getLocalizedErrorMessage,
  toErrorMessage,
  translatedError,
  type ErrorMessage,
} from '@/utils/errorMessages';

const EMAIL_CHANGE_LOGOUT_SECONDS = 5;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: { xs: 2.5, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateProfile, refreshUserProfile } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; plan: SubscriptionPlan | null }>({
    open: false,
    plan: null,
  });
  const [emailLogoutCountdown, setEmailLogoutCountdown] = useState<number | null>(null);
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>(getDisplayCurrency());
  const [success, setSuccess] = useState('');
  const [error, setError] = useState<ErrorMessage | null>(null);

  const getPlanName = (plan: SubscriptionPlan) => t(`plans.${plan.type}.name`);
  const getPlanFeature = (plan: SubscriptionPlan, feature: string, index: number) => {
    const key = `plans.${plan.type}.feature.${index}`;
    const translated = t(key);
    return translated === key ? feature : translated;
  };
  const errorMessage = error ? getLocalizedErrorMessage(error, t, 'common.errorOccurred') : null;
  const togglePasswordVisibility = (field: keyof typeof passwordVisibility) => {
    setPasswordVisibility((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const completeEmailChangeLogout = useCallback(() => {
    setEmailLogoutCountdown(null);
    useAuthStore.getState().logout();
    void navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email });
    }
    void loadSubscriptionData();
  }, [user]);

  useEffect(() => {
    if (emailLogoutCountdown === null) {
      return;
    }

    if (emailLogoutCountdown <= 0) {
      completeEmailChangeLogout();
      return;
    }

    const timer = window.setTimeout(() => {
      setEmailLogoutCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [emailLogoutCountdown, completeEmailChangeLogout]);

  const loadSubscriptionData = async () => {
    try {
      const plansData = await subscriptionService.getPlans();
      setPlans(plansData);
      const subData = await subscriptionService.getCurrentSubscription();
      if (subData) {
        setSubscription({
          ...subData,
          plan: plansData.find((plan) => plan.type === subData.type) || subData.plan,
        });
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error(t('settings.loadSubscriptionError'), err);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const nextProfileData = {
        name: profileData.name.trim(),
        email: profileData.email.trim().toLowerCase(),
      };
      const emailChanged = user?.email !== nextProfileData.email;
      await updateProfile(nextProfileData);
      setProfileData(nextProfileData);
      setError(null);

      if (emailChanged) {
        setSuccess(t('settings.profileUpdated'));
        setEmailLogoutCountdown(EMAIL_CHANGE_LOGOUT_SECONDS);
      } else {
        setSuccess(t('settings.profileUpdated'));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(toErrorMessage(err, 'settings.profileUpdateError'));
      setSuccess('');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(translatedError('settings.passwordMismatch'));
      setSuccess('');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError(translatedError('settings.passwordSameAsCurrent'));
      setSuccess('');
      return;
    }

    try {
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess(t('settings.passwordChanged'));
      setError(null);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(toErrorMessage(err, 'settings.passwordChangeError'));
      setSuccess('');
    }
  };

  const handleSubscribe = async () => {
    if (upgradeDialog.plan) {
      try {
        await subscriptionService.subscribe({ plan: upgradeDialog.plan.type });
        setUpgradeDialog({ open: false, plan: null });
        // Reload user profile to get updated subscription type
        await refreshUserProfile();
        await loadSubscriptionData();
        setSuccess(t('settings.subscriptionUpdated'));
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(toErrorMessage(err, 'settings.subscriptionUpdateError'));
      }
    }
  };

  const handleCurrencyChange = (currency: DisplayCurrency) => {
    setDisplayCurrency(currency);
    setDisplayCurrencyState(currency);
  };

  return (
    <Box>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_event, v: number) => setTabValue(v)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab label={t('settings.tabs.profile')} />
          <Tab label={t('settings.tabs.security')} />
          <Tab label={t('settings.tabs.subscription')} />
        </Tabs>
      </Box>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ maxWidth: 640 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('settings.profileInfo')}</Typography>
              <TextField
                label={t('settings.name')}
                fullWidth
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
              <TextField
                label={t('settings.email')}
                type="email"
                fullWidth
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
              <TextField
                label={t('settings.subscription')}
                fullWidth
                value={t(`plans.${user?.subscriptionType || 'FREE'}.name`)}
                disabled
                InputProps={{
                  startAdornment: (
                    <Chip
                      label={t(`plans.${user?.subscriptionType || 'FREE'}.name`)}
                      color={user?.subscriptionType !== 'FREE' ? 'primary' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  ),
                }}
              />
              <FormControl fullWidth>
                <InputLabel>{t('settings.displayCurrency')}</InputLabel>
                <Select
                  value={displayCurrency}
                  label={t('settings.displayCurrency')}
                  onChange={(event) => handleCurrencyChange(event.target.value as DisplayCurrency)}
                >
                  {DISPLAY_CURRENCY_OPTIONS.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={() => void handleProfileUpdate()}
                disabled={!profileData.name || !profileData.email}
              >
                {t('common.saveChanges')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ maxWidth: 640 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('settings.passwordTitle')}</Typography>
              <TextField
                label={t('settings.currentPassword')}
                type={passwordVisibility.currentPassword ? 'text' : 'password'}
                fullWidth
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <PasswordVisibilityToggle
                      visible={passwordVisibility.currentPassword}
                      onToggle={() => togglePasswordVisibility('currentPassword')}
                    />
                  ),
                }}
              />
              <TextField
                label={t('settings.newPassword')}
                type={passwordVisibility.newPassword ? 'text' : 'password'}
                fullWidth
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <PasswordVisibilityToggle
                      visible={passwordVisibility.newPassword}
                      onToggle={() => togglePasswordVisibility('newPassword')}
                    />
                  ),
                }}
              />
              <TextField
                label={t('settings.confirmNewPassword')}
                type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                fullWidth
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <PasswordVisibilityToggle
                      visible={passwordVisibility.confirmPassword}
                      onToggle={() => togglePasswordVisibility('confirmPassword')}
                    />
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={() => void handlePasswordChange()}
                disabled={
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
              >
                {t('common.changePassword')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Subscription Tab */}
      <TabPanel value={tabValue} index={2}>
        {subscription && (
          <Box sx={{ mb: 4 }}>
            <Card
              sx={{
                bgcolor: 'primary.main',
                color: '#000000',
                maxWidth: 640,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Star />
                  <Box>
                    <Typography variant="h5">{getPlanName(subscription.plan)}</Typography>
                    <Typography variant="body2">
                      {formatCurrency(subscription.plan.price)}/{t('settings.monthly')}
                    </Typography>
                  </Box>
                  <Chip
                    label={t(`subscription.status.${subscription.status}`)}
                    color={subscription.status === 'ACTIVE' ? 'success' : 'default'}
                    sx={{ ml: { sm: 'auto' } }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
          {t('settings.availablePlans')}
        </Typography>
        <Grid container spacing={2.5}>
          {plans.map((plan) => (
            <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
              <Paper
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: subscription?.plan.id === plan.id ? 2 : 1,
                  borderColor: subscription?.plan.id === plan.id ? 'primary.main' : 'divider',
                }}
              >
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{getPlanName(plan)}</Typography>
                  <Typography variant="h4" color="primary.main">
                    {formatCurrency(plan.price)}
                    <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
                      /{t('settings.monthly')}
                    </Typography>
                  </Typography>
                  <Stack spacing={1}>
                    {plan.features.map((feature, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <CheckCircle
                          sx={{ fontSize: 16, color: 'success.main' }}
                        />
                        <Typography variant="body2">{getPlanFeature(plan, feature, i)}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    variant={subscription?.plan.id === plan.id ? 'outlined' : 'contained'}
                    fullWidth
                    disabled={subscription?.plan.id === plan.id}
                    onClick={() => setUpgradeDialog({ open: true, plan })}
                  >
                    {subscription?.plan.id === plan.id ? t('settings.currentPlan') : t('common.upgrade')}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={upgradeDialog.open} onClose={() => setUpgradeDialog({ open: false, plan: null })}>
        <DialogTitle>{t('settings.confirmSubscriptionTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('settings.confirmSubscriptionMessage', {
              plan: upgradeDialog.plan ? getPlanName(upgradeDialog.plan) : '',
              price: upgradeDialog.plan ? formatCurrency(upgradeDialog.plan.price) : '',
              interval: t('settings.monthly'),
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog({ open: false, plan: null })}>{t('common.cancel')}</Button>
          <Button onClick={() => void handleSubscribe()} variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={emailLogoutCountdown !== null} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.emailChangedLogoutTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              {t('settings.emailChangedLogoutMessage', {
                seconds: emailLogoutCountdown ?? 0,
              })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                emailLogoutCountdown === null
                  ? 100
                  : ((EMAIL_CHANGE_LOGOUT_SECONDS - emailLogoutCountdown) / EMAIL_CHANGE_LOGOUT_SECONDS) * 100
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={completeEmailChangeLogout} variant="contained">
            {t('settings.emailChangedLogoutNow')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
