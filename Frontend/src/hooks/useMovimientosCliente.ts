import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService, type MovimientoBalanceRequest, type ModificarMovimientoRequest } from '../services/movimientos';

export function useMovimientosCliente(clienteId: number | undefined) {
  const idValido = typeof clienteId === 'number' && clienteId > 0;

  return useQuery({
    queryKey: ['movimientos', 'cliente', clienteId],
    queryFn: () => movimientosService.obtenerPorCliente(clienteId!),
    enabled: idValido,
    staleTime: 1000 * 30,
  });
}

export function useCrearMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MovimientoBalanceRequest) => movimientosService.crear(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', 'cliente', variables.idCliente] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useModificarMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ModificarMovimientoRequest) => movimientosService.modificar(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', 'cliente', variables.idCliente] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useEliminarMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idMovimiento, idCliente }: { idMovimiento: number; idCliente: number }) =>
      movimientosService.eliminar(idMovimiento, idCliente),
    onSuccess: (_, { idCliente }) => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', 'cliente', idCliente] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}
