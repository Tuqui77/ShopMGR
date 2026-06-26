import { apiClient } from './api';
import type { MetricasMes } from '../types';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Obtiene el mes y año actual
 */
function mesActual(): { mes: number; anio: number } {
  const now = new Date();
  return { mes: now.getMonth() + 1, anio: now.getFullYear() };
}

/**
 * Formatea una fecha como YYYY-MM-DD para la API (DateOnly de .NET)
 */
function formatFecha(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-01`;
}

// ============================================================================
// Service
// ============================================================================

export const metricasService = {
  /**
   * Obtiene todas las métricas del mes actual llamando a los 5 endpoints
   * del backend en paralelo.
   */
  async obtenerTodas(): Promise<MetricasMes> {
    const { mes, anio } = mesActual();
    const fecha = formatFecha(anio, mes);

    const [ingresos, horas, terminados, creados, aceptados] = await Promise.all([
      apiClient.get<number>('/Metricas/ObtenerIngresos', { params: { fecha } }),
      apiClient.get<number>('/Metricas/ObtenerHoras', { params: { fecha } }),
      apiClient.get<number>('/Metricas/ObtenerTrabajosTerminados', { params: { fecha } }),
      apiClient.get<number>('/Metricas/ObtenerPresupuestosEntregados', { params: { fecha } }),
      apiClient.get<number>('/Metricas/ObtenerPresupuestosAceptados', { params: { fecha } }),
    ]);

    return {
      ingresos: ingresos.data,
      horasTrabajadas: horas.data,
      trabajosTerminados: terminados.data,
      presupuestosCreados: creados.data,
      presupuestosAceptados: aceptados.data,
    };
  },
};
