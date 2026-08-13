import { useQuery, useQueries } from '@tanstack/react-query';
import { metricasService } from '../services/metricas';
import { periodoAnterior } from '../utils/periodos';

const STALE_TIME_METRICAS = 1000 * 60 * 5; // 5 minutos — las métricas no cambian con frecuencia

// ============================================================================
// Hooks
// ============================================================================

/**
 * Métricas de un mes puntual. Misma key que el dashboard
 * (`['metricas', anio, mes]`) → reuso de cache e invalidaciones.
 */
export function useMetricasMes(anio: number | undefined, mes: number | undefined) {
  return useQuery({
    queryKey: ['metricas', anio, mes],
    queryFn: () => metricasService.obtener(anio as number, mes as number),
    enabled: anio !== undefined && mes !== undefined,
    staleTime: STALE_TIME_METRICAS,
  });
}

/**
 * Comparativa mes actual vs mes anterior (rollover de año incluido).
 * 2 llamadas paralelas; devuelve { actual, anterior, isLoading, isError }.
 */
export function useComparativaMetricas() {
  const now = new Date();
  const mesActual = now.getMonth() + 1;
  const anioActual = now.getFullYear();
  const anterior = periodoAnterior(anioActual, mesActual);

  const [queryActual, queryAnterior] = useQueries({
    queries: [
      {
        queryKey: ['metricas', anioActual, mesActual],
        queryFn: () => metricasService.obtener(anioActual, mesActual),
        staleTime: STALE_TIME_METRICAS,
      },
      {
        queryKey: ['metricas', anterior.anio, anterior.mes],
        queryFn: () => metricasService.obtener(anterior.anio, anterior.mes),
        staleTime: STALE_TIME_METRICAS,
      },
    ],
  });

  return {
    actual: queryActual.data,
    anterior: queryAnterior.data,
    isLoading: queryActual.isLoading || queryAnterior.isLoading,
    isError: queryActual.isError || queryAnterior.isError,
  };
}

/**
 * Períodos con datos (D2). El fallback de 50 años NO vive aquí: vive en
 * utils/periodos.ts y lo aplica la página al construir el selector.
 */
export function usePeriodosMetricas() {
  const query = useQuery({
    queryKey: ['metricas', 'periodos'],
    queryFn: () => metricasService.obtenerPeriodos(),
    staleTime: STALE_TIME_METRICAS,
  });

  return {
    periodos: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
