import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  trabajosService,
  type CrearTrabajoRequest,
  type ModificarTrabajoRequest,
  type RegistrarHorasRequest,
} from '../services/trabajos';
import type { EstadoTrabajo } from '../types';

// ============================================================================
// Queries
// ============================================================================

/**
 * Obtiene todos los trabajos
 */
export function useTrabajos() {
  return useQuery({
    queryKey: ['trabajos'],
    queryFn: () => trabajosService.listar(),
  });
}

/**
 * Obtiene un trabajo por ID
 */
export function useTrabajo(id: number | undefined) {
  return useQuery({
    queryKey: ['trabajos', id],
    queryFn: () => trabajosService.obtenerPorId(id!),
    enabled: typeof id === 'number' && id >= 0,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Obtiene un trabajo con todas sus relaciones (detalle completo)
 */
export function useTrabajoDetalle(id: number | undefined) {
  return useQuery({
    queryKey: ['trabajos', id, 'detalle'],
    queryFn: () => trabajosService.obtenerDetalle(id!),
    enabled: typeof id === 'number' && id >= 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Obtiene todos los trabajos de un cliente
 */
export function useTrabajosPorCliente(idCliente: number | undefined) {
  return useQuery({
    queryKey: ['trabajos', 'cliente', idCliente],
    queryFn: () => trabajosService.obtenerPorCliente(idCliente!),
    enabled: typeof idCliente === 'number' && idCliente >= 0,
  });
}

/**
 * Obtiene todos los trabajos con un estado específico
 */
export function useTrabajosPorEstado(estado: EstadoTrabajo | undefined) {
  return useQuery({
    queryKey: ['trabajos', 'estado', estado],
    queryFn: () => trabajosService.obtenerPorEstado(estado!),
    enabled: !!estado,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Crea un nuevo trabajo
 */
export function useCrearTrabajo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (trabajo: CrearTrabajoRequest) => trabajosService.crear(trabajo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
    },
  });
}

/**
 * Modifica un trabajo existente
 */
export function useModificarTrabajo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, trabajo }: { id: number; trabajo: ModificarTrabajoRequest }) =>
      trabajosService.modificar(id, trabajo),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      queryClient.invalidateQueries({ queryKey: ['trabajos', id] });
      queryClient.invalidateQueries({ queryKey: ['trabajos', id, 'detalle'] });
    },
  });
}

/**
 * Termina un trabajo (cambia estado a Terminado)
 */
export function useTerminarTrabajo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => trabajosService.terminar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      queryClient.invalidateQueries({ queryKey: ['trabajos', id] });
      queryClient.invalidateQueries({ queryKey: ['trabajos', id, 'detalle'] });
      // También invalidar clientes porque cambia el balance
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

/**
 * Elimina un trabajo
 */
export function useEliminarTrabajo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => trabajosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
    },
  });
}

/**
 * Registra horas trabajadas en un trabajo
 */
export function useAgregarHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (horas: RegistrarHorasRequest) => trabajosService.agregarHoras(horas),
    onSuccess: (_, { idTrabajo }) => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      queryClient.invalidateQueries({ queryKey: ['trabajos', idTrabajo] });
      queryClient.invalidateQueries({ queryKey: ['trabajos', idTrabajo, 'detalle'] });
    },
  });
}
