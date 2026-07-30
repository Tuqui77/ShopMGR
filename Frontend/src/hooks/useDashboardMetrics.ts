import { useQuery } from '@tanstack/react-query';
import { metricasService } from '../services/metricas';

/**
 * Hook que obtiene las métricas del dashboard desde los endpoints
 * dedicados del backend. Las métricas se cachean por 5 minutos
 * ya que no cambian con frecuencia.
 */
export function useDashboardMetrics() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();

  return useQuery({
    queryKey: ['metricas', anio, mes],
    queryFn: () => metricasService.obtenerTodas(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
