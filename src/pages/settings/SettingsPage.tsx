import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { PageHeader } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { authService, subscriptionService } from '@/services';
import type { SubscriptionPlan, UserSubscription } from '@/types';
import { CheckCircle, Star } from '@mui/icons-material';
import { useI18n } from '@/i18n';
import { formatCurrency } from '@/utils';

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
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; plan: SubscriptionPlan | null }>({
    open: false,
    plan: null,
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const getPlanName = (plan: SubscriptionPlan) => t(`plans.${plan.type}.name`);
  const getPlanFeature = (plan: SubscriptionPlan, feature: string, index: number) => {
    const key = `plans.${plan.type}.feature.${index}`;
    const translated = t(key);
    return translated === key ? feature : translated;
  };

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email });
    }
    void loadSubscriptionData();
  }, [user]);

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
      const emailChanged = user?.email !== profileData.email;
      await updateProfile({ name: profileData.name, email: profileData.email });
      setError('');

      if (emailChanged) {
        setSuccess(t('settings.profileUpdated') + '. ' + t('settings.emailChangedRedirect'));
        setTimeout(() => {
          // Logout and redirect to login
          useAuthStore.getState().logout();
          navigate('/login');
        }, 3000);
      } else {
        setSuccess(t('settings.profileUpdated'));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.profileUpdateError'));
      setSuccess('');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }

    try {
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess(t('settings.passwordChanged'));
      setError('');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.passwordChangeError'));
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
        setError(err instanceof Error ? err.message : t('settings.subscriptionUpdateError'));
      }
    }
  };

  return (
    <Box>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
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
                type="password"
                fullWidth
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
              <TextField
                label={t('settings.newPassword')}
                type="password"
                fullWidth
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
              <TextField
                label={t('settings.confirmNewPassword')}
                type="password"
                fullWidth
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
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
                    <Typography variant="body2" color="text.secondary">
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
    </Box>
  );
}
