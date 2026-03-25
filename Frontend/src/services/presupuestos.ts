import { apiClient } from './api';
import type {
  Presupuesto,
  PresupuestoBackendDTO,
  Material,
  Cliente,
  ClienteBackendDTO,
  CrearPresupuestoRequest,
  ModificarPresupuestoRequest,
  EstadoPresupuesto,
} from '../types';

// ============================================================================
// Tipos internos para el servicio
// ============================================================================

interface MaterialItem {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Response wrapper de .NET
interface ListResponse<T> {
  $id?: string;
  $values?: T[];
}

// ============================================================================
// Mappers
// ============================================================================

function mapMateriales(dto: { $id: string; $values: MaterialItem[] } | undefined): Material[] {
  const values = dto?.$values || [];
  return values.map(m => ({
    id: m.id,
    descripcion: m.descripcion,
    cantidad: m.cantidad,
    precioUnitario: m.precioUnitario,
    subtotal: m.subtotal,
  }));
}

function mapCliente(dto: ClienteBackendDTO | null | undefined): Cliente | null {
  if (!dto) return null;
  return {
    id: dto.id,
    nombreCompleto: dto.nombreCompleto,
    telefono: dto.telefono?.$values?.map(t => t.telefono) || [],
    direccion: dto.direccion?.$values?.[0]
      ? `${dto.direccion.$values[0].calle} ${dto.direccion.$values[0].altura}`
      : undefined,
    balance: dto.balance || 0,
    trabajosCount: dto.trabajos?.$values?.length || 0,
    presupuestosCount: dto.presupuestos?.$values?.length || 0,
  };
}

function mapPresupuestoBackend(dto: PresupuestoBackendDTO): Presupuesto {
  return {
    id: dto.id,
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    estado: dto.estado,
    fecha: dto.fecha,
    cliente: mapCliente(dto.cliente) || { id: dto.idCliente, nombreCompleto: '', telefono: [], balance: 0, trabajosCount: 0, presupuestosCount: 0 },
    horasEstimadas: dto.horasEstimadas || 0,
    costoMateriales: dto.costoMateriales || 0,
    costoLabor: dto.costoLabor || 0,
    costoInsumos: dto.costoInsumos || 0,
    total: dto.total || 0,
    materiales: mapMateriales(dto.materiales),
  };
}

// ============================================================================
// Servicio de Presupuestos
// ============================================================================

export const presupuestosService = {
  /**
   * Obtiene todos los presupuestos
   */
  async listar(): Promise<Presupuesto[]> {
    const response = await apiClient.get<ListResponse<PresupuestoBackendDTO>>('/Presupuestos/ListarPresupuestos');
    const values = response.data.$values || [];
    return values.map(mapPresupuestoBackend);
  },

  /**
   * Obtiene un presupuesto por su ID
   */
  async obtenerPorId(id: number): Promise<Presupuesto> {
    const response = await apiClient.get<PresupuestoBackendDTO>('/Presupuestos/ObtenerPresupuestoPorId', {
      params: { idPresupuesto: id },
    });
    return mapPresupuestoBackend(response.data);
  },

  /**
   * Obtiene un presupuesto con todas sus relaciones (detalle completo)
   */
  async obtenerDetalle(id: number): Promise<Presupuesto> {
    const response = await apiClient.get<PresupuestoBackendDTO>('/Presupuestos/ObtenerDetallePresupuesto', {
      params: { idPresupuesto: id },
    });
    return mapPresupuestoBackend(response.data);
  },

  /**
   * Obtiene todos los presupuestos de un cliente
   */
  async obtenerPorCliente(idCliente: number): Promise<Presupuesto[]> {
    const response = await apiClient.get<ListResponse<PresupuestoBackendDTO>>('/Presupuestos/ObtenerPresupuestosPorCliente', {
      params: { idCliente },
    });
    const values = response.data.$values || [];
    return values.map(mapPresupuestoBackend);
  },

  /**
   * Obtiene todos los presupuestos con un estado específico
   */
  async obtenerPorEstado(estado: EstadoPresupuesto): Promise<Presupuesto[]> {
    const response = await apiClient.get<ListResponse<PresupuestoBackendDTO>>('/Presupuestos/ObtenerPresupuestosEstado', {
      params: { estado },
    });
    const values = response.data.$values || [];
    return values.map(mapPresupuestoBackend);
  },

  /**
   * Crea un nuevo presupuesto
   */
  async crear(presupuesto: CrearPresupuestoRequest): Promise<Presupuesto> {
    const response = await apiClient.post<PresupuestoBackendDTO>('/Presupuestos/CrearPresupuesto', presupuesto);
    return mapPresupuestoBackend(response.data);
  },

  /**
   * Modifica los datos de un presupuesto existente
   */
  async modificar(id: number, presupuesto: ModificarPresupuestoRequest): Promise<void> {
    await apiClient.patch(`/Presupuestos/ActualizarPresupuesto?idPresupuesto=${id}`, presupuesto);
  },

  /**
   * Elimina un presupuesto
   */
  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/Presupuestos/EliminarPresupuesto?idPresupuesto=${id}`);
  },

  /**
   * Acepta un presupuesto (cambia estado a Aceptado)
   */
  async aceptar(id: number): Promise<void> {
    await apiClient.patch(`/Presupuestos/ActualizarPresupuesto?idPresupuesto=${id}`, {
      estado: 'Aceptado',
    });
  },

  /**
   * Rechaza un presupuesto (cambia estado a Rechazado)
   */
  async rechazar(id: number): Promise<void> {
    await apiClient.patch(`/Presupuestos/ActualizarPresupuesto?idPresupuesto=${id}`, {
      estado: 'Rechazado',
    });
  },

  /**
   * Obtiene el costo hora de trabajo
   */
  async obtenerCostoHora(): Promise<number> {
    const response = await apiClient.get<string>('/Presupuestos/ObtenerCostoHoraDeTrabajo');
    // El backend retorna: "El costo de la hora de trabajo es: $XXX"
    const match = response.data.match(/\$(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  },

  /**
   * Actualiza el costo hora de trabajo
   */
  async actualizarCostoHora(nuevoCosto: string): Promise<void> {
    await apiClient.patch('/Presupuestos/ActualizarCostoHoraDeTrabajo', nuevoCosto);
  },
};

// ============================================================================
// Exports de tipos para uso en hooks
// ============================================================================

export type { CrearPresupuestoRequest, ModificarPresupuestoRequest };