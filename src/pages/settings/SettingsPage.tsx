import { useState, useEffect } from 'react';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
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

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email });
    }
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      const [subData, plansData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getPlans(),
      ]);
      setSubscription(subData);
      setPlans(plansData);
    } catch (err) {
      console.error('Failed to load subscription data', err);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfile({ name: profileData.name, email: profileData.email });
      setSuccess('Profile updated successfully');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      setSuccess('');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Password changed successfully');
      setError('');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      setSuccess('');
    }
  };

  const handleSubscribe = async () => {
    if (upgradeDialog.plan) {
      try {
        await subscriptionService.subscribe({ planId: upgradeDialog.plan.id });
        setUpgradeDialog({ open: false, plan: null });
        await loadSubscriptionData();
        setSuccess('Subscription updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update subscription');
      }
    }
  };

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

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
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Profile" />
          <Tab label="Security" />
          <Tab label="Subscription" />
        </Tabs>
      </Box>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ maxWidth: 600 }}>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Profile Information</Typography>
              <TextField
                label="Name"
                fullWidth
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
              <TextField
                label="Subscription"
                fullWidth
                value={user?.subscriptionType || 'FREE'}
                disabled
                InputProps={{
                  startAdornment: (
                    <Chip
                      label={user?.subscriptionType}
                      color={user?.subscriptionType !== 'FREE' ? 'primary' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleProfileUpdate}
                disabled={!profileData.name || !profileData.email}
              >
                Save Changes
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ maxWidth: 600 }}>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Change Password</Typography>
              <TextField
                label="Current Password"
                type="password"
                fullWidth
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
              <Button
                variant="contained"
                onClick={handlePasswordChange}
                disabled={
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
              >
                Change Password
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
                color: 'primary.contrastText',
                maxWidth: 600,
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Star />
                  <Box>
                    <Typography variant="h5">{subscription.plan.name}</Typography>
                    <Typography variant="body2">
                      ${subscription.plan.price}/{subscription.plan.interval.toLowerCase()}
                    </Typography>
                  </Box>
                  <Chip
                    label={subscription.status}
                    color={subscription.status === 'ACTIVE' ? 'success' : 'default'}
                    sx={{ ml: 'auto' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}

        <Typography variant="h6" gutterBottom>
          Available Plans
        </Typography>
        <Grid container spacing={2}>
          {plans.map((plan) => (
            <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
              <Paper
                sx={{
                  p: 2,
                  height: '100%',
                  border: subscription?.plan.id === plan.id ? 2 : 1,
                  borderColor: subscription?.plan.id === plan.id ? 'primary.main' : 'divider',
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="h6">{plan.name}</Typography>
                  <Typography variant="h4" color="primary.main">
                    ${plan.price}
                    <Typography variant="body2" color="text.secondary">
                      /{plan.interval.toLowerCase()}
                    </Typography>
                  </Typography>
                  <Stack spacing={1}>
                    {plan.features.map((feature, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <CheckCircle
                          sx={{ fontSize: 16, color: 'success.main' }}
                        />
                        <Typography variant="body2">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    variant={subscription?.plan.id === plan.id ? 'outlined' : 'contained'}
                    fullWidth
                    disabled={subscription?.plan.id === plan.id}
                    onClick={() => setUpgradeDialog({ open: true, plan })}
                  >
                    {subscription?.plan.id === plan.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={upgradeDialog.open} onClose={() => setUpgradeDialog({ open: false, plan: null })}>
        <DialogTitle>Confirm Subscription Change</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to {subscription?.plan.id === upgradeDialog.plan?.id ? 'downgrade' : 'upgrade'} to{' '}
            <strong>{upgradeDialog.plan?.name}</strong> at ${upgradeDialog.plan?.price}/
            {upgradeDialog.plan?.interval.toLowerCase()}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog({ open: false, plan: null })}>Cancel</Button>
          <Button onClick={handleSubscribe} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
