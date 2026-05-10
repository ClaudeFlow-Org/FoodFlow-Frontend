import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n';
import type { Dish } from '@/types';
import { LineItemEditor } from './LineItemEditor';

const dishes: Dish[] = [
  {
    id: 1,
    name: 'Menu ejecutivo',
    description: 'Entrada y fondo',
    price: 12.5,
    ingredients: 'arroz, pollo',
    userId: 1,
    createdAt: '2026-05-09T10:00:00',
    updatedAt: '2026-05-09T10:00:00',
  },
];

const renderEditor = (onChange = vi.fn(), availableDishes = dishes) =>
  render(
    <I18nProvider>
      <LineItemEditor
        items={[
          {
            dishId: 1,
            dishName: 'Menu ejecutivo',
            quantity: 2,
            unitPrice: 12.5,
          },
        ]}
        availableDishes={availableDishes}
        onChange={onChange}
      />
    </I18nProvider>
  );

describe('LineItemEditor', () => {
  // Prueba integral: calcula total visible de items de orden (FE-INT-006)
  it('renders the current order total from line items', () => {
    renderEditor();

    expect(screen.getByText('Total: $25.00')).toBeInTheDocument();
  });
  // fin prueba

  // Prueba integral: agrega item vacio al editar orden (FE-INT-007)
  it('adds a blank line item when the add button is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderEditor(onChange);

    await user.click(screen.getByRole('button', { name: /Agregar/i }));

    expect(onChange).toHaveBeenCalledWith([
      {
        dishId: 1,
        dishName: 'Menu ejecutivo',
        quantity: 2,
        unitPrice: 12.5,
      },
      {
        dishId: 0,
        dishName: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  });
  // fin prueba

  // Prueba integral: bloquea agregar items sin platos disponibles (FE-INT-008)
  it('disables adding line items when no dishes are available', () => {
    renderEditor(vi.fn(), []);

    expect(screen.getByRole('button', { name: /Agregar/i })).toBeDisabled();
  });
  // fin prueba
});
