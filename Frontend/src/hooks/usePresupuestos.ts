import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presupuestosService, type CrearPresupuestoRequest, type ModificarPresupuestoRequest } from '../services/presupuestos';
import type { EstadoPresupuesto } from '../types';

// ============================================================================
// Queries
// ============================================================================

/**
 * Obtiene todos los presupuestos
 */
export function usePresupuestos() {
  return useQuery({
    queryKey: ['presupuestos'],
    queryFn: () => presupuestosService.listar(),
  });
}

/**
 * Obtiene un presupuesto por ID
 */
export function usePresupuesto(id: number | undefined) {
  return useQuery({
    queryKey: ['presupuestos', id],
    queryFn: () => presupuestosService.obtenerPorId(id!),
    enabled: typeof id === 'number' && id > 0,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Obtiene un presupuesto con todas sus relaciones (detalle completo)
 */
export function usePresupuestoDetalle(id: number | undefined) {
  return useQuery({
    queryKey: ['presupuestos', id, 'detalle'],
    queryFn: () => presupuestosService.obtenerDetalle(id!),
    enabled: typeof id === 'number' && id > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Obtiene todos los presupuestos de un cliente
 */
export function usePresupuestosPorCliente(idCliente: number | undefined) {
  return useQuery({
    queryKey: ['presupuestos', 'cliente', idCliente],
    queryFn: () => presupuestosService.obtenerPorCliente(idCliente!),
    enabled: typeof idCliente === 'number' && idCliente > 0,
  });
}

/**
 * Obtiene todos los presupuestos con un estado específico
 */
export function usePresupuestosPorEstado(estado: EstadoPresupuesto | undefined) {
  return useQuery({
    queryKey: ['presupuestos', 'estado', estado],
    queryFn: () => presupuestosService.obtenerPorEstado(estado!),
    enabled: !!estado,
  });
}

/**
 * Obtiene el costo hora de trabajo
 */
export function useCostoHora() {
  return useQuery({
    queryKey: ['costo-hora'],
    queryFn: () => presupuestosService.obtenerCostoHora(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Crea un nuevo presupuesto
 */
export function useCrearPresupuesto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (presupuesto: CrearPresupuestoRequest) => presupuestosService.crear(presupuesto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
    },
  });
}

/**
 * Modifica un presupuesto existente
 */
export function useModificarPresupuesto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, presupuesto }: { id: number; presupuesto: ModificarPresupuestoRequest }) =>
      presupuestosService.modificar(id, presupuesto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos', id] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos', id, 'detalle'] });
    },
  });
}

/**
 * Elimina un presupuesto
 */
export function useEliminarPresupuesto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => presupuestosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
    },
  });
}

/**
 * Acepta un presupuesto (cambia estado a Aceptado)
 */
export function useAceptarPresupuesto(options?: { onError?: (error: Error) => void }) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => presupuestosService.aceptar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos', id] });
    },
    onError: options?.onError,
  });
}

/**
 * Rechaza un presupuesto (cambia estado a Rechazado)
 */
export function useRechazarPresupuesto(options?: { onError?: (error: Error) => void }) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => presupuestosService.rechazar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos', id] });
    },
    onError: options?.onError,
  });
}

/**
 * Actualiza el costo hora de trabajo
 */
export function useActualizarCostoHora() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (nuevoCosto: number) => presupuestosService.actualizarCostoHora(nuevoCosto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costo-hora'] });
    },
  });
}