import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';

async function fetchCostoHora(): Promise<number> {
  const response = await apiClient.get<number>('/Presupuestos/ObtenerCostoHoraDeTrabajo');
  return response.data;
}

async function actualizarCostoHora(nuevoCosto: number): Promise<void> {
  // Enviar solo el query parameter, sin body
  const params = new URLSearchParams();
  params.append('nuevoCosto', nuevoCosto.toString());
  await apiClient.request({
    method: 'PATCH',
    url: `/Presupuestos/ActualizarCostoHoraDeTrabajo?${params.toString()}`,
    data: '', // String vacío en lugar de undefined
  });
}

export function useCostoHora() {
  return useQuery({
    queryKey: ['costoHora'],
    queryFn: fetchCostoHora,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useActualizarCostoHora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actualizarCostoHora,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costoHora'] });
    },
  });
}
