import { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  AttachMoney as FinanceIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { AppControls } from '@/components/common';
import { useI18n } from '@/i18n';

const drawerWidth = 240;
const brandLogoSrc = '/foodflow-mark.png';

const menuItems = [
  { icon: <DashboardIcon />, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: <RestaurantIcon />, labelKey: 'nav.dishes', path: '/dishes' },
  { icon: <InventoryIcon />, labelKey: 'nav.inventory', path: '/products' },
  { icon: <ReceiptIcon />, labelKey: 'nav.orders', path: '/orders' },
  { icon: <FinanceIcon />, labelKey: 'nav.finance', path: '/finance' },
  { icon: <SettingsIcon />, labelKey: 'nav.settings', path: '/settings' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const currentMenuItem = menuItems.find((item) => item.path === location.pathname);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    void navigate('/login');
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            component="img"
            src={brandLogoSrc}
            alt=""
            sx={{ width: 34, height: 34, objectFit: 'contain' }}
          />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {t('app.name')}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                void navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            aria-label={t('nav.openMenu')}
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentMenuItem ? t(currentMenuItem.labelKey) : t('app.name')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <AppControls />
            </Box>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.name}
            </Typography>
            <IconButton aria-label={t('nav.accountMenu')} onClick={handleMenuOpen} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => void navigate('/settings')}>{t('nav.settings')}</MenuItem>
              <MenuItem sx={{ display: { sm: 'none' } }}>
                <AppControls compact />
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                {t('nav.logout')}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
