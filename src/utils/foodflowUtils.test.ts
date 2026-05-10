import { describe, expect, it } from 'vitest';
import {
  calculateAverageOrderValue,
  calculateInventoryValue,
  calculatePercentageChange,
  calculateProfitMargin,
  calculateSubtotal,
  isLowStock,
} from './calculations';
import { formatCurrency, formatPercentage, truncate } from './format';
import {
  doValuesMatch,
  isNonNegative,
  isNotEmpty,
  isPositive,
  isValidEmail,
  isValidPassword,
  validatePasswordStrength,
} from './validation';

describe('FoodFlow utility calculations', () => {
  // Prueba unitaria: calcula subtotal de orden con varios platos (FE-UT-001)
  it('calculates the subtotal for multiple order line items', () => {
    expect(
      calculateSubtotal([
        { quantity: 2, unitPrice: 12.5 },
        { quantity: 3, unitPrice: 8 },
      ])
    ).toBe(49);
  });
  // fin prueba

  // Prueba unitaria: calcula valor de inventario por stock y costo (FE-UT-002)
  it('calculates inventory value from stock level and unit cost', () => {
    expect(calculateInventoryValue(18, 4.25)).toBe(76.5);
  });
  // fin prueba

  // Prueba unitaria: calcula margen de ganancia y evita division por cero (FE-UT-003)
  it('calculates profit margin and returns zero when revenue is zero', () => {
    expect(calculateProfitMargin(200, 120)).toBe(0.4);
    expect(calculateProfitMargin(0, 120)).toBe(0);
  });
  // fin prueba

  // Prueba unitaria: calcula cambio porcentual para periodos financieros (FE-UT-004)
  it('calculates percentage change including a zero baseline', () => {
    expect(calculatePercentageChange(100, 125)).toBe(0.25);
    expect(calculatePercentageChange(0, 50)).toBe(1);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });
  // fin prueba

  // Prueba unitaria: calcula ticket promedio y maneja cero ordenes (FE-UT-005)
  it('calculates average order value and returns zero without orders', () => {
    expect(calculateAverageOrderValue(300, 6)).toBe(50);
    expect(calculateAverageOrderValue(300, 0)).toBe(0);
  });
  // fin prueba

  // Prueba unitaria: detecta stock bajo al llegar al umbral (FE-UT-006)
  it('marks inventory as low stock when it reaches the threshold', () => {
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
  });
  // fin prueba
});

describe('FoodFlow utility formatting', () => {
  // Prueba unitaria: formatea importes monetarios para reportes (FE-UT-007)
  it('formats currency values with fixed decimals', () => {
    expect(formatCurrency(1234.5, 'USD', 'en-US')).toBe('$1,234.50');
  });
  // fin prueba

  // Prueba unitaria: formatea porcentajes de variacion financiera (FE-UT-008)
  it('formats decimal ratios as percentages', () => {
    expect(formatPercentage(0.256, 1)).toBe('25.6%');
  });
  // fin prueba

  // Prueba unitaria: trunca textos largos de tarjetas y tablas (FE-UT-009)
  it('truncates long text with a configurable suffix', () => {
    expect(truncate('Inventario de insumos perecibles', 13)).toBe('Inventario...');
    expect(truncate('Corto', 13)).toBe('Corto');
  });
  // fin prueba
});

describe('FoodFlow utility validation', () => {
  // Prueba unitaria: valida correos de inicio de sesion (FE-UT-010)
  it('validates email format for authentication forms', () => {
    expect(isValidEmail('owner@foodflow.test')).toBe(true);
    expect(isValidEmail('owner-foodflow.test')).toBe(false);
  });
  // fin prueba

  // Prueba unitaria: valida requisitos minimos de password (FE-UT-011)
  it('validates basic password length and strong password requirements', () => {
    expect(isValidPassword('secret')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);

    expect(validatePasswordStrength('Strong123')).toEqual({
      isValid: true,
      errors: [],
    });
    expect(validatePasswordStrength('weak')).toEqual({
      isValid: false,
      errors: [
        'Password must be at least 8 characters long',
        'Password must contain at least one uppercase letter',
        'Password must contain at least one number',
      ],
    });
  });
  // fin prueba

  // Prueba unitaria: valida campos requeridos y numeros de inventario (FE-UT-012)
  it('validates required text, matching values, and positive numbers', () => {
    expect(isNotEmpty('  Mesa 4  ')).toBe(true);
    expect(isNotEmpty('   ')).toBe(false);
    expect(doValuesMatch('Premium', 'Premium')).toBe(true);
    expect(isPositive(1)).toBe(true);
    expect(isPositive(0)).toBe(false);
    expect(isNonNegative(0)).toBe(true);
    expect(isNonNegative(-1)).toBe(false);
  });
  // fin prueba
});
