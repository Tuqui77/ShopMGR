import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesService, type CrearClienteRequest, type ModificarClienteRequest } from '../services/clientes';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesService.listar(),
  });
}

export function useCliente(id: number | undefined) {
  const idValido = typeof id === 'number' && id >= 0;
  
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clientesService.obtenerPorId(id!),
    enabled: idValido,
    staleTime: 1000 * 30,
  });
}

export function useClienteDetalle(id: number) {
  return useQuery({
    queryKey: ['clientes', id, 'detalle'],
    queryFn: () => clientesService.obtenerDetalle(id),
    enabled: !!id,
  });
}

export function useCrearCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cliente: CrearClienteRequest) => clientesService.crear(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useModificarCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, cliente }: { id: number; cliente: ModificarClienteRequest }) =>
      clientesService.modificar(id, cliente),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes', id] });
    },
  });
}

export function useEliminarCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => clientesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}