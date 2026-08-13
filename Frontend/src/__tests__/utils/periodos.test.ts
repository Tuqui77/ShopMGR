import { describe, it, expect } from 'vitest';
import {
  normalizarPeriodos,
  agruparPorAnio,
  aniosFallback,
  resolverE1,
  nombreMes,
  formatPeriodo,
  parsePeriodo,
  periodoAnterior,
} from '../../utils/periodos';

describe('utils/periodos (issue #118)', () => {
  describe('normalizarPeriodos', () => {
    it('ordena desc (año, luego mes)', () => {
      const periodos = [
        { anio: 2025, mes: 3 },
        { anio: 2026, mes: 7 },
        { anio: 2026, mes: 8 },
        { anio: 2025, mes: 12 },
      ];

      expect(normalizarPeriodos(periodos)).toEqual([
        { anio: 2026, mes: 8 },
        { anio: 2026, mes: 7 },
        { anio: 2025, mes: 12 },
        { anio: 2025, mes: 3 },
      ]);
    });

    it('dedupea por (anio, mes)', () => {
      const periodos = [
        { anio: 2026, mes: 8 },
        { anio: 2026, mes: 8 },
        { anio: 2026, mes: 7 },
      ];

      expect(normalizarPeriodos(periodos)).toEqual([
        { anio: 2026, mes: 8 },
        { anio: 2026, mes: 7 },
      ]);
    });

    it('lista vacía → lista vacía (no revienta)', () => {
      expect(normalizarPeriodos([])).toEqual([]);
    });
  });

  describe('agruparPorAnio', () => {
    it('agrupa años → meses con datos (desc)', () => {
      const porAnio = agruparPorAnio([
        { anio: 2026, mes: 7 },
        { anio: 2026, mes: 8 },
        { anio: 2025, mes: 3 },
        { anio: 2025, mes: 12 },
      ]);

      expect(porAnio.get(2026)).toEqual([8, 7]);
      expect(porAnio.get(2025)).toEqual([12, 3]);
    });
  });

  describe('aniosFallback', () => {
    it('aniosFallback(2026) → [2026..1977] (50 años)', () => {
      const anios = aniosFallback(2026, 50);

      expect(anios).toHaveLength(50);
      expect(anios[0]).toBe(2026);
      expect(anios[49]).toBe(1977);
    });
  });

  describe('resolverE1', () => {
    it('mes existe en el año nuevo → lo mantiene', () => {
      expect(resolverE1(2025, 8, [12, 8, 3])).toBe(8);
    });

    it('mes no existe → primer mes con datos (la lista viene desc)', () => {
      expect(resolverE1(2025, 8, [12, 3])).toBe(12);
    });

    it('lista vacía → devuelve el mes actual (caso cubierto por disabled)', () => {
      expect(resolverE1(2025, 8, [])).toBe(8);
    });
  });

  describe('nombreMes', () => {
    it('nombreMes(8) → "Agosto" (es-AR)', () => {
      expect(nombreMes(8)).toBe('Agosto');
    });

    it('mes inválido → fallback numérico', () => {
      expect(nombreMes(13)).toBe('13');
    });
  });

  describe('formatPeriodo / parsePeriodo (URL ?periodo=AAAA-MM)', () => {
    it('formatPeriodo(2026, 8) → "2026-08"', () => {
      expect(formatPeriodo(2026, 8)).toBe('2026-08');
    });

    it('parsePeriodo("2025-07") → { anio: 2025, mes: 7 }', () => {
      expect(parsePeriodo('2025-07')).toEqual({ anio: 2025, mes: 7 });
    });

    it('parsePeriodo inválido → null', () => {
      expect(parsePeriodo(null)).toBeNull();
      expect(parsePeriodo('')).toBeNull();
      expect(parsePeriodo('2025-13')).toBeNull(); // mes fuera de rango
      expect(parsePeriodo('2025-7')).toBeNull(); // sin padding
      expect(parsePeriodo('abc')).toBeNull();
    });
  });

  describe('periodoAnterior (rollover de año)', () => {
    it('agosto → julio del mismo año', () => {
      expect(periodoAnterior(2026, 8)).toEqual({ anio: 2026, mes: 7 });
    });

    it('enero → diciembre del año previo', () => {
      expect(periodoAnterior(2026, 1)).toEqual({ anio: 2025, mes: 12 });
    });
  });
});
