import { describe, it, expect } from 'vitest';
import { calcularSubtotal } from '../../utils/materiales';

describe('calcularSubtotal', () => {
  it('calcula cantidad * precio', () => {
    expect(calcularSubtotal(2, 1500)).toBe(3000);
  });

  it('redondea a 2 decimales (evita ruido de punto flotante)', () => {
    expect(calcularSubtotal(0.1, 3)).toBe(0.3);
  });

  it('multiplicación exacta con cantidad decimal', () => {
    expect(calcularSubtotal(2.5, 999.99)).toBe(2499.98);
  });

  it('1.005 * 100 redondea a 100.5 (Number.EPSILON mitiga el error)', () => {
    expect(calcularSubtotal(1.005, 100)).toBe(100.5);
  });

  it('precio 0 devuelve 0', () => {
    expect(calcularSubtotal(3, 0)).toBe(0);
  });

  it('cantidad 0 devuelve 0', () => {
    expect(calcularSubtotal(0, 500)).toBe(0);
  });

  it('devuelve 0 para valores NaN o no finitos', () => {
    expect(calcularSubtotal(Number.NaN, 500)).toBe(0);
    expect(calcularSubtotal(2, Number.NaN)).toBe(0);
    expect(calcularSubtotal(Number.POSITIVE_INFINITY, 500)).toBe(0);
  });
});