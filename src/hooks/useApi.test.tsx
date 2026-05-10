import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n';
import { useApi } from './useApi';

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
);

describe('useApi', () => {
  // Prueba integral: ejecuta llamada exitosa y guarda datos (FE-INT-003)
  it('stores data after a successful API call', async () => {
    const apiCall = vi.fn().mockResolvedValue({ totalIncome: 120 });
    const { result } = renderHook(() => useApi(apiCall), { wrapper });

    await act(async () => {
      await result.current.execute();
    });

    expect(apiCall).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual({ totalIncome: 120 });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
  // fin prueba

  // Prueba integral: captura error de llamada fallida (FE-INT-004)
  it('stores error messages when the API call fails', async () => {
    const apiCall = vi.fn().mockRejectedValue(new Error('No se pudo cargar'));
    const { result } = renderHook(() => useApi(apiCall), { wrapper });

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('No se pudo cargar');
    });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });
  // fin prueba

  // Prueba integral: reinicia datos, error y carga (FE-INT-005)
  it('resets data, error, and loading state', async () => {
    const apiCall = vi.fn().mockResolvedValue(['orden']);
    const { result } = renderHook(() => useApi(apiCall), { wrapper });

    await act(async () => {
      await result.current.execute();
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
  // fin prueba
});
