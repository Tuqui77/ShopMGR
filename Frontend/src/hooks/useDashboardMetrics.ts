import { useMemo } from 'react';
import { useTrabajos } from './useTrabajos';
import type { MetricasMes } from '../types';

/**
 * Hook personalizado para obtener las métricas del mes actual del Dashboard
 * Calcula las métricas desde los datos de trabajos obtenidos del backend
 */
export function useDashboardMetrics(): {
  metricas: MetricasMes | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: trabajos, isLoading, error } = useTrabajos();

  const metricas = useMemo(() => {
    if (!trabajos || trabajos.length === 0) {
      return null;
    }

    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    // Filtrar trabajos del mes actual
    const trabajosMesActual = trabajos.filter(t => {
      if (!t.fechaInicio) return false;
      const fecha = new Date(t.fechaInicio);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    // Trabajos terminados en el mes actual
    const terminadosMes = trabajosMesActual.filter(t => t.estado === 'Terminado');

    // Calcular ingresos (total de trabajos terminados en el mes)
    const ingresos = terminadosMes.reduce((sum, t) => sum + (t.totalLabor || 0), 0);

    // Calcular horas trabajadas (suma de horas registradas en el mes)
    // Como el backend puede no tener horas detalladas, usamos horasRegistradas
    const horasTrabajadas = trabajosMesActual.reduce(
      (sum, t) => sum + (t.horasRegistradas || 0),
      0
    );

    // Cantidad de trabajos terminados
    const trabajosTerminados = terminadosMes.length;

    // Por ahora sin cambios (comparación con mes anterior)
    // Se podría implementar si se guarda historial
    return {
      ingresos,
      horasTrabajadas,
      trabajosTerminados,
      cambiosIngresos: 0,
      cambiosHoras: 0,
      cambiosTerminados: 0,
    };
  }, [trabajos]);

  return {
    metricas: metricas || null,
    isLoading,
    error: error ? new Error(String(error)) : null,
  };
}