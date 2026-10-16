import { describe, it, expect } from 'vitest';
import {
  LIMITES_HORAS_ESTIMADAS,
  MENSAJE_HORAS_ESTIMADAS,
  validarHorasEstimadas,
} from '../../utils/validacionPresupuesto';

describe('validarHorasEstimadas', () => {
  it('expone los límites alineados al DTO del backend', () => {
    expect(LIMITES_HORAS_ESTIMADAS).toEqual({ min: 1, max: 1000 });
    expect(MENSAJE_HORAS_ESTIMADAS).toBe(
      'El campo horas estimadas tiene que estar entre 1 y 1000',
    );
  });

  it('rechaza vacío y espacios con el mensaje del backend', () => {
    expect(validarHorasEstimadas('')).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('   ')).toBe(MENSAJE_HORAS_ESTIMADAS);
  });

  it('rechaza valores no numéricos', () => {
    expect(validarHorasEstimadas('abc')).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('NaN')).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('2,5')).toBe(MENSAJE_HORAS_ESTIMADAS);
  });

  it('rechaza 0, negativos y el límite inferior no alcanzado', () => {
    expect(validarHorasEstimadas('0')).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('-1')).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('0.5')).toBe(MENSAJE_HORAS_ESTIMADAS);
  });

  it('rechaza valores mayores al máximo', () => {
    expect(validarHorasEstimadas('1001')).toBe(MENSAJE_HORAS_ESTIMADAS);
  });

  it('acepta los límites exactos', () => {
    expect(validarHorasEstimadas('1')).toBeNull();
    expect(validarHorasEstimadas('1000')).toBeNull();
  });

  it('acepta decimales dentro del rango', () => {
    expect(validarHorasEstimadas('2.5')).toBeNull();
    expect(validarHorasEstimadas('999.99')).toBeNull();
  });

  it('con { min: 0 } acepta 0 y decimales, y sigue rechazando negativos/no numéricos/máximo', () => {
    expect(validarHorasEstimadas('0', { min: 0 })).toBeNull();
    expect(validarHorasEstimadas('2.5', { min: 0 })).toBeNull();

    expect(validarHorasEstimadas('-1', { min: 0 })).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('', { min: 0 })).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('abc', { min: 0 })).toBe(MENSAJE_HORAS_ESTIMADAS);
    expect(validarHorasEstimadas('1001', { min: 0 })).toBe(MENSAJE_HORAS_ESTIMADAS);
  });
});
