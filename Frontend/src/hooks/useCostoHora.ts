import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

async function fetchCostoHora(): Promise<number> {
  const response = await apiClient.get<number>('/Presupuestos/ObtenerCostoHoraDeTrabajo');
  return response.data;
}

export function useCostoHora() {
  return useQuery({
    queryKey: ['costoHora'],
    queryFn: fetchCostoHora,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
