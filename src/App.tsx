import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import DishesPage from '@/pages/dishes/DishesPage';
import ProductsPage from '@/pages/products/ProductsPage';
import OrdersPage from '@/pages/orders/OrdersPage';
import FinancePage from '@/pages/finance/FinancePage';
import SettingsPage from '@/pages/settings/SettingsPage';
import { I18nProvider } from '@/i18n';
import { ThemeModeProvider } from '@/theme';

function App() {
  return (
    <I18nProvider>
      <ThemeModeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dishes" element={<DishesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeModeProvider>
    </I18nProvider>
  );
}

export default App;
