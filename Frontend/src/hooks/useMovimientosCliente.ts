import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../services/movimientos';

export function useMovimientosCliente(clienteId: number | undefined) {
  const idValido = typeof clienteId === 'number' && clienteId > 0;

  return useQuery({
    queryKey: ['movimientos', 'cliente', clienteId],
    queryFn: () => movimientosService.obtenerPorCliente(clienteId!),
    enabled: idValido,
    staleTime: 1000 * 30,
  });
}
