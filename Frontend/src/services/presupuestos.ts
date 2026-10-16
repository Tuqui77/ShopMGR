import { apiClient } from './api';
import { calcularSubtotal } from '../utils/materiales';
import { getApiErrorStatus, parseApiErrorBody } from '../utils/apiErrors';
import type {
  Presupuesto,
  PresupuestoBackendDTO,
  PresupuestoListaDTO,
  Material,
  Cliente,
  ClienteBackendDTO,
  CrearPresupuestoRequest,
  MaterialRequest,
  EstadoPresupuesto,
} from '../types';

export interface ModificarPresupuestoRequest {
  titulo?: string;
  descripcion?: string | null;
  horasEstimadas?: number;
  estado?: EstadoPresupuesto;
  valorHoraDeTrabajo?: number;
  idCliente?: number;
  idTrabajo?: number;
  materiales?: MaterialRequest[];
}

// Helper to extract error message from backend response.
// El parseo de formatos ({ error }, { detail }, { message }, { errors }) vive
// en `utils/apiErrors`; acá se conserva el contrato histórico de `aceptar()` y
// `rechazar()`: siempre lanza `Error` con un mensaje.
async function handleApiError(error: unknown): Promise<never> {
  const body = parseApiErrorBody(error);
  const mensaje = body.generalMessage ?? body.allMessages[0];
  if (mensaje) throw new Error(mensaje);

  // Sin mensaje explícito del backend: se mantienen los fallbacks históricos
  // para no cambiar el comportamiento observable de aceptar()/rechazar().
  const status = getApiErrorStatus(error);
  throw new Error(status !== null ? `Error ${status}` : 'Error de conexión');
}

// ============================================================================
// Tipos internos para el servicio
// ============================================================================

interface MaterialItem {
  id: number;
  descripcion: string;
  cantidad: number;
  precio?: number;  // Backend returns "Precio", not "precioUnitario"
  Precio?: number;
}

// ============================================================================
// Mappers
// ============================================================================

function mapMateriales(dto: MaterialItem[] | undefined): Material[] {
  const values = dto || [];
  return values.map(m => {
    const precioUnitario = m.precio || m.Precio || 0;
    return {
      id: m.id,
      descripcion: m.descripcion,
      cantidad: m.cantidad,
      precioUnitario,
      subtotal: calcularSubtotal(m.cantidad, precioUnitario),
    };
  });
}

function mapCliente(dto: ClienteBackendDTO | null | undefined): Cliente | null {
  if (!dto) return null;
  
  // Handle circular reference (e.g., {"$ref":"3"}) or partial reference
  if (!dto.id && !dto.nombreCompleto) return null;
  
  return {
    id: dto.id,
    nombreCompleto: dto.nombreCompleto,
    telefono: dto.telefono?.map(t => t.telefono) || [],
    direccion: dto.direccion?.[0]
      ? `${dto.direccion[0].calle} ${dto.direccion[0].altura}`
      : undefined,
    balance: dto.balance || 0,
    trabajosCount: dto.trabajos?.length || 0,
    presupuestosCount: dto.presupuestos?.length || 0,
  };
}

// Mapper for list view (simplified DTO)
function mapPresupuestoLista(dto: PresupuestoListaDTO): Presupuesto {
  return {
    id: dto.id,
    titulo: dto.titulo || '',
    descripcion: '',
    estado: dto.estado || 'Pendiente',
    fecha: '',
    cliente: {
      id: dto.idCliente ?? 0,
      nombreCompleto: dto.nombreCliente || '',
      telefono: [],
      balance: 0,
      trabajosCount: 0,
      presupuestosCount: 0,
    },
    horasEstimadas: dto.horasEstimadas || 0,
    costoMateriales: 0,
    costoLabor: 0,
    costoInsumos: 0,
    total: dto.total || 0,
    materiales: [],
    idCliente: dto.idCliente,
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
   * Obtiene todos los presupuestos (list view)
   */
  async listar(): Promise<Presupuesto[]> {
    const response = await apiClient.get<PresupuestoListaDTO[]>('/Presupuestos/ListarPresupuestos');
    const values = response.data;
    return values.map(mapPresupuestoLista).sort((a, b) => b.id - a.id);
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
    const response = await apiClient.get<PresupuestoBackendDTO[]>('/Presupuestos/ObtenerPresupuestosPorCliente', {
      params: { idCliente },
    });
    const values = response.data;
    return values.map(mapPresupuestoBackend).sort((a, b) => b.id - a.id);
  },

  /**
   * Obtiene todos los presupuestos con un estado específico
   */
  async obtenerPorEstado(estado: EstadoPresupuesto): Promise<Presupuesto[]> {
    const response = await apiClient.get<PresupuestoBackendDTO[]>('/Presupuestos/ObtenerPresupuestosEstado', {
      params: { estado },
    });
    const values = response.data;
    return values.map(mapPresupuestoBackend).sort((a, b) => b.id - a.id);
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
  async modificar(id: number, data: ModificarPresupuestoRequest): Promise<void> {
    await apiClient.patch(`/Presupuestos/ActualizarPresupuesto?idPresupuesto=${id}`, data);
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
  try {
    await apiClient.patch(`/Presupuestos/AceptarPresupuesto?idPresupuesto=${id}`);
  } catch (error) {
    await handleApiError(error);
  }
},

/**
 * Rechaza un presupuesto (cambia estado a Rechazado)
 */
async rechazar(id: number): Promise<void> {
  try {
    await apiClient.patch(`/Presupuestos/RechazarPresupuesto?idPresupuesto=${id}`);
  } catch (error) {
    await handleApiError(error);
  }
},

  /**
   * Obtiene el costo hora de trabajo
   */
  async obtenerCostoHora(): Promise<number> {
    const response = await apiClient.get<number>('/Presupuestos/ObtenerCostoHoraDeTrabajo');
    return response.data;
  },

  /**
   * Actualiza el costo hora de trabajo
   */
  async actualizarCostoHora(nuevoCosto: number): Promise<void> {
    // Enviar solo el query parameter, sin body
    const params = new URLSearchParams();
    params.append('nuevoCosto', nuevoCosto.toString());
    await apiClient.request({
      method: 'PATCH',
      url: `/Presupuestos/ActualizarCostoHoraDeTrabajo?${params.toString()}`,
      data: '', // String vacío en lugar de undefined
    });
  },
};

// ============================================================================
// Exports de tipos para uso en hooks
// ============================================================================

export type { CrearPresupuestoRequest };