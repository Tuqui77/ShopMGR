import { apiClient } from './api';
import type { MetricasMes, PeriodoMetrica } from '../types';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Formatea una fecha como YYYY-MM-DD para la API (DateOnly de .NET)
 */
function formatFecha(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-01`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** DateOnly de .NET se serializa como "YYYY-MM-DD" (ej. "2024-09-01"). */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parsea un ítem del listado de períodos aceptando ambos contratos:
 * - String ISO "YYYY-MM-DD" (DateOnly de .NET, contrato real)
 * - Objeto { anio, mes } (contrato asumido en etapas previas)
 * Cualquier otra forma (string mal formado, mes fuera de rango, null,
 * objeto con tipos incorrectos, etc.) se descarta.
 */
function parsePeriodoMetrica(value: unknown): PeriodoMetrica | null {
  if (typeof value === 'string') {
    if (!ISO_DATE_REGEX.test(value)) return null;
    const anio = Number(value.slice(0, 4));
    const mes = Number(value.slice(5, 7));
    const dia = Number(value.slice(8, 10));
    if (mes < 1 || mes > 12) return null;
    // Round-trip UTC: descarta fechas inexistentes (ej. "2026-02-30", "2026-08-32")
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (
      fecha.getUTCFullYear() !== anio ||
      fecha.getUTCMonth() !== mes - 1 ||
      fecha.getUTCDate() !== dia
    ) {
      return null;
    }
    return { anio, mes };
  }

  if (isRecord(value)) {
    if (typeof value.anio !== 'number' || typeof value.mes !== 'number') return null;
    return { anio: value.anio, mes: value.mes };
  }

  return null;
}

/**
 * Extrae el listado de períodos de /Metricas/ObtenerMesesConDatos. El backend
 * usa ReferenceHandler.IgnoreCycles, así que la respuesta puede ser un array
 * plano o un objeto {$id, $values} (mismo patrón que extractMovimientos).
 * Descarta ítems que no cumplan ninguno de los dos contratos de período.
 * La ordenación la hace normalizarPeriodos en la página, no el service.
 */
function extractPeriodos(data: unknown): PeriodoMetrica[] {
  if (!data) return [];
  const items = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.$values)
      ? data.$values
      : [];
  return items
    .map(parsePeriodoMetrica)
    .filter((periodo): periodo is PeriodoMetrica => periodo !== null);
}

// ============================================================================
// Service
// ============================================================================

export const metricasService = {
  /**
   * Obtiene las 5 métricas del período dado llamando a los endpoints del
   * backend en paralelo. Contrato null: sin datos → null (no 0).
   */
  async obtener(anio: number, mes: number): Promise<MetricasMes> {
    const fecha = formatFecha(anio, mes);

    const [ingresos, horas, terminados, creados, aceptados] = await Promise.all([
      apiClient.get<number | null>('/Metricas/ObtenerIngresos', { params: { fecha } }),
      apiClient.get<number | null>('/Metricas/ObtenerHoras', { params: { fecha } }),
      apiClient.get<number | null>('/Metricas/ObtenerTrabajosTerminados', { params: { fecha } }),
      apiClient.get<number | null>('/Metricas/ObtenerPresupuestosEntregados', { params: { fecha } }),
      apiClient.get<number | null>('/Metricas/ObtenerPresupuestosAceptados', { params: { fecha } }),
    ]);

    return {
      // ?? null: campo ausente/undefined se trata como null (defensivo, 6.3)
      ingresos: ingresos.data ?? null,
      horasTrabajadas: horas.data ?? null,
      trabajosTerminados: terminados.data ?? null,
      presupuestosCreados: creados.data ?? null,
      presupuestosAceptados: aceptados.data ?? null,
    };
  },

  /** GET /Metricas/ObtenerMesesConDatos → períodos con ≥1 registro (D2). */
  async obtenerPeriodos(): Promise<PeriodoMetrica[]> {
    const response = await apiClient.get<unknown>('/Metricas/ObtenerMesesConDatos');
    return extractPeriodos(response.data);
  },
};
