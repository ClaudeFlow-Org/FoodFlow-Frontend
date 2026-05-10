import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from './ProtectedRoute';

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login FoodFlow</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Panel privado FoodFlow</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  afterEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  // Prueba integral: redirige al login sin sesion activa (FE-INT-001)
  it('redirects unauthenticated users to the login route', () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    renderProtectedRoute();

    expect(screen.getByText('Login FoodFlow')).toBeInTheDocument();
    expect(screen.queryByText('Panel privado FoodFlow')).not.toBeInTheDocument();
  });
  // fin prueba

  // Prueba integral: permite entrar con token persistido (FE-INT-002)
  it('renders children when a persisted token exists', () => {
    localStorage.setItem('token', 'foodflow-token');

    renderProtectedRoute();

    expect(screen.getByText('Panel privado FoodFlow')).toBeInTheDocument();
    expect(screen.queryByText('Login FoodFlow')).not.toBeInTheDocument();
  });
  // fin prueba
});
